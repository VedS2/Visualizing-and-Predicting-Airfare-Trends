from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sqlalchemy import create_engine, text
import os
import nbformat
from nbconvert.preprocessors import ExecutePreprocessor
import papermill as pm
import uuid

base_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base_dir, 'flights.db')
engine = create_engine(f'sqlite:///{db_path}')


def initialize_database():
    print("Initializing database...")
    csv_path = os.path.join(base_dir, 'airline_data.csv')

    if not os.path.exists(csv_path):
        if os.path.exists(db_path):
            print("CSV not found, using existing DB.")
            return engine
        raise FileNotFoundError("CSV file missing and DB not found.")

    df = pd.read_csv(csv_path)
    df.to_sql('flights', engine, if_exists='replace', index=False)
    print("Database initialized.")
    return engine

db_engine = initialize_database()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

def initialize_macro_data():
    macro_csv_path = os.path.join(base_dir, 'macro_data.csv')
    if not os.path.exists(macro_csv_path):
        print("Warning: macro_data.csv not found. Macro data will not be available.")
        return

    try:
        macro_df = pd.read_csv(macro_csv_path)
        macro_df.to_sql('macro_data', engine, if_exists='replace', index=False)
        print("Macro data initialized.")
    except Exception as e:
        print(f"Error initializing macro data: {e}")

initialize_macro_data()

def get_db_connection():
    return db_engine.connect()

@app.route('/api/routes', methods=['GET'])
def get_routes():
    try:
        conn = get_db_connection()
        query = text("""
            SELECT 
                airport_1, 
                airport_2, 
                COUNT(*) as frequency,
                AVG(fare) as avg_fare,
                SUM(passengers) as total_passengers
            FROM flights
            GROUP BY airport_1, airport_2
            ORDER BY total_passengers DESC
            LIMIT 150
        """)
        result = pd.read_sql_query(query, conn)
        conn.close()

        if not result.empty:
            max_passengers = result['total_passengers'].max()
            result['popularity'] = (result['total_passengers'] / max_passengers * 10).round(1)

        routes = [{
            'from': row['airport_1'],
            'to': row['airport_2'],
            'popularity': float(row['popularity']),
            'passengerCount': int(row['total_passengers']),
            'averageFare': float(row['avg_fare'])
        } for _, row in result.iterrows()]

        return jsonify(routes)

    except Exception as e:
        print(f"Error fetching routes: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict_route_fare():
    try:
        data = request.get_json()
        departure = data.get("departure")
        arrival = data.get("arrival")
        start_date = data.get("startDate")
        end_date = data.get("endDate")
        event = data.get("event")

        print(departure, arrival, start_date, end_date, event)
        if not all([departure, arrival, start_date, end_date]):
            return jsonify({"error": "Missing required fields."}), 400

        notebook_path = os.path.join(base_dir, "visualization_notebook.ipynb")
        if not os.path.exists(notebook_path):
            return jsonify({"error": "Notebook file not found."}), 500

        output_dir = os.path.join(base_dir, "notebook_output")
        os.makedirs(output_dir, exist_ok=True)

        output_path = os.path.join(output_dir, f"output_{uuid.uuid4().hex}.ipynb")

        pm.execute_notebook(
            input_path=notebook_path,
            output_path=output_path,
            parameters={
                "departure": departure,
                "arrival": arrival,
                "start_date": start_date,
                "end_date": end_date,
                "event": event
            },
            kernel_name="python3"
        )

        executed_nb = nbformat.read(output_path, as_version=4)

        for cell in executed_nb.cells:
            if cell.cell_type == 'code':
                for output in cell.get("outputs", []):
                    if output.output_type == "error":
                        error_message = output.get("evalue", "")
                        if "No data found for route" in error_message:
                            return jsonify({
                                "error": "Not enough data available to make an accurate prediction about this scenario."
                            }), 400
                        else:
                            return jsonify({
                                "error": f"Notebook execution error: {error_message}"
                            }), 500

        last_cell = executed_nb.cells[-1]
        predicted_price = None
        actual_price = None

        if last_cell.cell_type == 'code':
            outputs = last_cell.get("outputs", [])
            for output in outputs:
                if output.output_type == "stream":
                    try:
                        values = output.text.strip().split(',')
                        predicted_price = float(values[0])
                        if len(values) > 1 and values[1] != 'None':
                            actual_price = float(values[1])
                        break
                    except (ValueError, IndexError):
                        pass
                elif output.output_type == "execute_result":
                    try:
                        values = output["data"]["text/plain"].strip().split(',')
                        predicted_price = float(values[0])
                        if len(values) > 1 and values[1] != 'None':
                            actual_price = float(values[1])
                        break
                    except (ValueError, IndexError, KeyError):
                        pass

        return jsonify({
            "predictedPrice": predicted_price,
            "actualPrice": actual_price
        })

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/quarterly-fares', methods=['POST'])
def get_quarterly_fares():
    try:
        data = request.get_json()
        departure = data.get("departure")
        arrival = data.get("arrival")

        if not departure or not arrival:
            return jsonify({"error": "Missing required fields."}), 400

        conn = get_db_connection()

        query = text("""
            SELECT Year, quarter, AVG(fare) as average_fare
            FROM flights
            WHERE (airport_1 = :departure AND airport_2 = :arrival)
               OR (airport_1 = :arrival AND airport_2 = :departure)
            GROUP BY Year, quarter
            ORDER BY Year, quarter
        """)

        result = pd.read_sql_query(query, conn, params={"departure": departure, "arrival": arrival})
        conn.close()

        if result.empty:
            return jsonify([])

        result['quarter_label'] = result['Year'].astype(str) + " Q" + result['quarter'].astype(str)
        response_data = result[['quarter_label', 'average_fare']].rename(columns={
            "quarter_label": "label",
            "average_fare": "value"
        }).to_dict(orient="records")

        return jsonify(response_data)

    except Exception as e:
        print(f"Error fetching quarterly fares: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/yearly-fares', methods=['POST'])
def get_yearly_fares():
    try:
        data = request.get_json()
        departure = data['departure']
        arrival = data['arrival']

        conn = get_db_connection()
        query = text("""
            SELECT Year, AVG(fare) AS avg_fare
            FROM flights
            WHERE (airport_1 = :departure AND airport_2 = :arrival)
            OR (airport_1 = :arrival AND airport_2 = :departure)
            GROUP BY Year
            ORDER BY Year
        """)
        result = conn.execute(query, {'departure': departure, 'arrival': arrival}).fetchall()
        conn.close()

        response = [{'label': str(row[0]), 'value': round(row[1], 2)} for row in result]
        return jsonify(response)

    except Exception as e:
        print(f"Error in get_yearly_fares: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/macro-metrics', methods=['POST'])
def get_macro_metrics():
    try:
        data = request.get_json()
        input_date = pd.to_datetime(data.get('date')).to_pydatetime()

        conn = get_db_connection()
        query = text("""
            SELECT * FROM macro_data
            WHERE date <= :input_date
            ORDER BY date DESC
            LIMIT 1
        """)
        row = conn.execute(query, {"input_date": input_date}).fetchone()
        conn.close()

        if row is None:
            return jsonify({"error": "No macro data found for the selected date."}), 404

        result = row._mapping

        return jsonify({
            "GDP": result["GDP"],
            "oilPrice": result["Global Oil Price"],
            "unemploymentRate": result["Unemployment Rate"]
        })

    except Exception as e:
        print(f"Error in get_macro_metrics: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return "Flight Data API is running!"


if __name__ == '__main__':
    app.run(debug=True, port=3000, host='0.0.0.0')

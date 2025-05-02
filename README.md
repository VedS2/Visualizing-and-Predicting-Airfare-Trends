# Visualizing Airfare Trends ✈️

## 📙 Description

**Visualizing Airfare Trends** is a full-stack web application that enables users to explore and analyze historical U.S. flight pricing data in an interactive, visual format. Built with a React + TypeScript frontend and a Flask + Pandas backend, the system integrates a variety of datasets—including FAA airfare statistics and macroeconomic indicators—to help users identify patterns and trends in airline pricing over time. Users can click on specific flight routes across a U.S. map to view pricing trends by quarter and year, compare fare fluctuations across time periods, and analyze how special events like recessions or pandemics impact air travel costs.

The application also features a fare prediction engine that leverages a decision tree model to estimate prices based on user-defined routes, dates, and events. In addition to trend graphs and fare forecasts, the system provides economic context by surfacing relevant macro-level metrics like GDP, oil prices, and unemployment rates for the selected date range. With its intuitive interface and data-driven backend, this tool supports both casual exploration and deeper analytical insights into the dynamics of airfare pricing in the U.S.

![App Overview](screenshots/map-overview.png)

---

## ⚙️ Installation

Before running this project, ensure you have the following tools installed:

- [Anaconda](https://www.anaconda.com/download) - for the backend environment
- [Node.js & npm](https://nodejs.org/en/download/) - for running the frontend

### 1. Add the Required Datasets

You will need two CSV files:  
- `airline_data.csv` – the main flight data  
- `macro_data.csv` – the combined macroeconomic dataset

Refer to the accompanying `doc/team020_datasets.pdf` document for instructions on how to download or generate these datasets.

Once obtained, ensure both datasets are in the following folder:

`visualizing-airfare-trends/visualizing-airfare-trends-backend/`

### 2. Install Dependencies

#### Backend (Flask + Pandas)

Open a terminal and run the following commands to set up and start the backend:

```bash
cd visualizing-airfare-trends/visualizing-airfare-trends-backend
conda env create -f environment.yml
conda activate visualizing_airfare_trends_backend
python app.py
```

This will start the backend server at http://localhost:3000. You should see the message:

`Flight Data API is running!`

#### Frontend (React + Vite)

In a new terminal, run the following to install dependencies and launch the frontend:

```bash
cd visualizing-airfare-trends/visualizing-airfare-trends-frontend
npm install --legacy-peer-deps
npm run dev
```

The application will be accessible in your browser at http://localhost:5173.

---

## 🚀 Execution

Once both the backend and frontend are running, you can access the application at http://localhost:5173.

Here’s how to use the application:

1. **Start on the Interactive Map:**
   - You’ll see a map of the U.S. with airports and flight routes.
   - Click on a route between two airports to explore its fare trends.

2. **View Quarterly & Yearly Fare Trends:**
   - After selecting a route and selecting `View Data`, the system displays two bar charts.
     - One shows **quarterly pricing trends**.
     - The other shows **yearly pricing trends**.
   - These trends are based on real historical data from the FAA.

3. **Use the Calendar Panel for Prediction:**
   - In the prediction panel, select a **start and end date** using the calendar.
   - Choose a **special event** (e.g., Pandemic, Recession) to simulate its impact.
   - Click **“Predict Route Fare”** to receive a model-generated fare estimate.
   - The system uses a decision tree model trained on historical data to compute this prediction.

4. **Macroeconomic Context:**
   - When a date is chosen, the panel also fetches and displays:
     - GDP
     - Oil prices
     - Unemployment rate
   - These metrics correspond to the selected date and provide additional context for interpreting fare changes.

5. **Clear Selections & Explore More Routes:**
   - On the home page, click **“Show All Routes”** to reset the view and select a new route.

This interactive pipeline allows users to explore and compare how airfare changes over time, under different conditions, and between routes — offering both historical insight and predictive power.

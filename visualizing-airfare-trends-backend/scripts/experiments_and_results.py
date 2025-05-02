"""
This script is used to generate visualizations and performance metrics based on the model's predicted vs. actual airfare values. 

It includes:
- Line plots comparing predicted vs. actual fares for 5 selected airport routes
- A box plot visualizing the distribution of absolute errors
- Summary statistics of absolute errors
- Quantitative performance metrics such as MAE, RMSE, R², and MAPE

Input:
- Place the dataset `predicted_vs_actual.csv` (link to dataset: https://drive.google.com/file/d/1NqFB25U9ejgl_eXgaZo85VLtKesXmiHZ/view?usp=sharing) in the folder: 
  visualizing-airfare-trends-backend/data

To run:
From the scripts folder, execute (make sure the conda environment is running):
python analyze_predictions.py
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from pathlib import Path

script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
data_path = backend_dir / "data" / "predicted_vs_actual.csv" 

df = pd.read_csv(data_path)

df["date"] = pd.to_datetime(df["Year"].astype(str) + "-" + (df["quarter"] * 3 - 2).astype(str) + "-01")

airport_names = {
    13198: "MCI", 13303: "MIA", 13577: "MYR", 12953: "LGA", 12478: "JFK",
    12954: "LGB", 15376: "TUS", 11540: "ELP", 12191: "HOU"
}

random_routes = pd.DataFrame({
    'airportid_1': [13198, 13577, 13198, 12954, 11540],
    'airportid_2': [13303, 12953, 12478, 15376, 12191]
})

fig, axes = plt.subplots(nrows=5, ncols=2, figsize=(7, 12), sharex=True)

for idx, row in enumerate(random_routes.itertuples(index=False)):
    route_data = df[
        (df["airportid_1"] == row.airportid_1) & 
        (df["airportid_2"] == row.airportid_2)
    ].copy().sort_values("date")

    ax_pred = axes[idx, 0]
    ax_actual = axes[idx, 1]

    ax_pred.plot(route_data["date"], route_data["predicted_fare"], color='blue')
    ax_pred.set_title(f"{airport_names[row.airportid_1]} to {airport_names[row.airportid_2]} - Predicted")

    ax_actual.plot(route_data["date"], route_data["actual_fare"], color='green')
    ax_actual.set_title(f"{airport_names[row.airportid_1]} to {airport_names[row.airportid_2]} - Actual")

    ax_pred.set_ylabel("Fare ($)")

for ax in axes[-1]:
    ax.set_xlabel("From 1993 to 2024")

plt.tight_layout()
plt.show()

df["abs_error"] = (df["predicted_fare"] - df["actual_fare"]).abs()

box = plt.boxplot(df["abs_error"], vert=True, patch_artist=True)
for patch in box['boxes']:
    patch.set_facecolor('orange')
for median in box['medians']:
    median.set_color('red')

plt.xticks([])
plt.title("Absolute Fare Prediction Error")
plt.ylabel("Absolute Error ($)")
plt.grid(True)
plt.show()

print("Summary Statistics for Absolute Error:")
print(df["abs_error"].describe())

y_pred = df["predicted_fare"]
y_true = df["actual_fare"]

mae = mean_absolute_error(y_true, y_pred)
rmse = mean_squared_error(y_true, y_pred, squared=False)
r2 = r2_score(y_true, y_pred)
mape = (np.abs((y_true - y_pred) / y_true) * 100).mean()

accuracy_metrics = pd.DataFrame({
    "Metric": ["Mean Absolute Error (MAE)", "Root Mean Squared Error (RMSE)", 
               "R² Score", "Mean Absolute Percentage Error (MAPE)"],
    "Value": [mae, rmse, r2, mape]
})

print("\nModel Evaluation Metrics:")
print(accuracy_metrics.to_string(index=False))

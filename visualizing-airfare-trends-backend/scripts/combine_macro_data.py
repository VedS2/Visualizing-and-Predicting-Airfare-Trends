import pandas as pd
import numpy as np
from pathlib import Path

script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
data_dir = backend_dir / "data"
output_path = backend_dir / "macro_data.csv"

unemployment_path = data_dir / "UNRATE.csv"
gdp_path = data_dir / "GDP.csv"
oil_path = data_dir / "POILBREUSDQ.csv"

unemp_df = pd.read_csv(unemployment_path)
unemp_df['observation_date'] = pd.to_datetime(unemp_df['observation_date'])
unemp_df['year'] = unemp_df['observation_date'].dt.year
unemp_df['quarter'] = unemp_df['observation_date'].dt.quarter

quarterly_unemp = (
    unemp_df.groupby(['year', 'quarter'])['UNRATE']
    .mean()
    .reset_index()
)

quarter_start_month = {1: '01', 2: '04', 3: '07', 4: '10'}
quarterly_unemp['month'] = quarterly_unemp['quarter'].map(quarter_start_month)
quarterly_unemp['observation_date'] = pd.to_datetime(
    quarterly_unemp['year'].astype(str) + '-' + quarterly_unemp['month'] + '-01'
)

quarterly_unemp.rename(columns={'UNRATE': 'Unemployment Rate'}, inplace=True)
quarterly_unemp = quarterly_unemp[['year', 'quarter', 'observation_date', 'Unemployment Rate']]

gdp_df = pd.read_csv(gdp_path)
oil_df = pd.read_csv(oil_path)

gdp_df['observation_date'] = pd.to_datetime(gdp_df['observation_date'])
oil_df['observation_date'] = pd.to_datetime(oil_df['observation_date'])

gdp_df['year'] = gdp_df['observation_date'].dt.year
gdp_df['quarter'] = gdp_df['observation_date'].dt.quarter

oil_df['year'] = oil_df['observation_date'].dt.year
oil_df['quarter'] = oil_df['observation_date'].dt.quarter

oil_df.rename(columns={'POILBREUSDQ': 'Global Oil Price'}, inplace=True)

merged_df = pd.merge(
    gdp_df[['year', 'quarter', 'observation_date', 'GDP']],
    oil_df[['year', 'quarter', 'Global Oil Price']],
    on=['year', 'quarter'],
    how='inner'
)

merged_df = pd.merge(
    merged_df,
    quarterly_unemp[['year', 'quarter', 'Unemployment Rate']],
    on=['year', 'quarter'],
    how='inner'
)

merged_df.rename(columns={'observation_date': 'date'}, inplace=True)
merged_df = merged_df[['year', 'date', 'quarter', 'GDP', 'Global Oil Price', 'Unemployment Rate']]

merged_df.to_csv(output_path, index=False)
print(f"Combined macro data saved to: {output_path}")

import React, { useEffect, useState } from 'react';
import './MacroMetricsPanel.css';

interface MacroMetricsPanelProps {
  dateRange: { startDate: Date; endDate: Date };
}

interface MacroMetrics {
  GDP: number;
  oilPrice: number;
  unemploymentRate: number;
}

const MacroMetricsPanel: React.FC<MacroMetricsPanelProps> = ({ dateRange }) => {
  const [metrics, setMetrics] = useState<MacroMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooFarInFuture, setTooFarInFuture] = useState<boolean>(false);

  useEffect(() => {
    const selectedDate = dateRange.startDate;
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    if (selectedDate > sixMonthsFromNow) {
      setTooFarInFuture(true);
      setMetrics(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMacroData = async () => {
      try {
        setLoading(true);
        setTooFarInFuture(false);
        const res = await fetch('http://localhost:3000/api/macro-metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: selectedDate.toISOString().split('T')[0],
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch macro data');
        setMetrics(data);
        setError(null);
      } catch (err: any) {
        console.error('Macro fetch error:', err);
        setError('Failed to load macro metrics.');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMacroData();
  }, [dateRange]);

  return (
    <div className="macro-metrics-box">
      <h2 className="macro-metrics-heading">Macro Metrics</h2>
      <div className="macro-content">
        {tooFarInFuture ? (
          <p><strong>Macro data is not available for the chosen date yet!</strong></p>
        ) : loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>{error}</p>
        ) : metrics ? (
          <>
            <p><strong>GDP:</strong> ${metrics.GDP.toLocaleString()}</p>
            <p><strong>Global Oil Price:</strong> ${metrics.oilPrice.toFixed(2)}</p>
            <p><strong>Unemployment Rate:</strong> {metrics.unemploymentRate.toFixed(2)}%</p>
          </>
        ) : (
          <p>No data available for the selected range.</p>
        )}
      </div>
    </div>
  );
};

export default MacroMetricsPanel;

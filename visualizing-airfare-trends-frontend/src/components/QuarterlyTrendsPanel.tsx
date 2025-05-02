import React, { useEffect, useState } from 'react';
import './QuarterlyTrendsPanel.css';

interface QuarterlyTrendsPanelProps {
  departure: string;
  arrival: string;
  dateRange: { startDate: Date; endDate: Date };
  predictedPrice: number | null;
}

interface QuarterlyDataPoint {
  label: string; // "YYYY Qn"
  value: number;
}

const BARS_PER_PAGE = 12;

const getQuarter = (date: Date): number => {
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
};

const getQuarterLabel = (date: Date): string => {
  return `${date.getFullYear()} Q${getQuarter(date)}`;
};

const getQuarterLabelsInRange = (start: Date, end: Date): Set<string> => {
  const labels = new Set<string>();
  const cursor = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);

  while (cursor <= end) {
    labels.add(getQuarterLabel(cursor));
    cursor.setMonth(cursor.getMonth() + 3);
  }

  return labels;
};

const isPastDateRange = (end: Date): boolean => {
  const cutoff = new Date(2024, 2, 31);
  return end <= cutoff;
};

const QuarterlyTrendsPanel: React.FC<QuarterlyTrendsPanelProps> = ({
  departure,
  arrival,
  dateRange,
  predictedPrice,
}) => {
  const [data, setData] = useState<QuarterlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const selectedLabels = getQuarterLabelsInRange(dateRange.startDate, dateRange.endDate);

  useEffect(() => {
    const fetchQuarterlyData = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:3000/api/quarterly-fares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ departure, arrival }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch data');
        setData(json);
        setError(null);

        const firstMatchIndex = json.findIndex((item: QuarterlyDataPoint) =>
          selectedLabels.has(item.label)
        );
        if (firstMatchIndex !== -1) {
          const targetPage = Math.floor(firstMatchIndex / BARS_PER_PAGE);
          setPage(targetPage);
        } else {
          setPage(0);
        }
      } catch (err: any) {
        console.error('Error fetching quarterly fares:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    if (
      departure &&
      arrival &&
      departure !== 'Select departure' &&
      arrival !== 'Select arrival'
    ) {
      fetchQuarterlyData();
    }
  }, [departure, arrival, dateRange]);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, Math.floor(data.length / BARS_PER_PAGE)));

  const startIndex = page * BARS_PER_PAGE;
  const endIndex = startIndex + BARS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="historical-trends-box">
      <h2 className="historical-trends-heading">Average Quarterly Pricing</h2>
      <div className="chart">
        <div className="chart-wrapper">
          <div className="chart-controls">
            <button className="chart-nav-btn" onClick={handlePrev} disabled={page === 0}>&lt;</button>
            <button className="chart-nav-btn" onClick={handleNext} disabled={endIndex >= data.length}>&gt;</button>
          </div>
          <div className="chart-bars">
            {predictedPrice !== null && isPastDateRange(dateRange.endDate) && (
              <div
                className="actual-price-line"
                style={{ bottom: `${(predictedPrice / maxValue) * 100}%` }}
              >
                <span className="price-label">Predicted: ${predictedPrice.toFixed(2)}</span>
              </div>
            )}
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p>{error}</p>
            ) : paginatedData.length === 0 ? (
              <p>No data available.</p>
            ) : (
              paginatedData.map((item) => {
                const isSelected = selectedLabels.has(item.label);
                return (
                  <div
                    key={item.label}
                    className={`chart-bar ${isSelected ? 'highlighted' : ''}`}
                    style={{ height: `calc(${(item.value / maxValue) * 100}%)` }}
                  >
                    <span className="bar-value">${item.value.toFixed(0)}</span>
                    <div className="bar-fill"></div>
                    <span className="bar-label">{item.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuarterlyTrendsPanel;

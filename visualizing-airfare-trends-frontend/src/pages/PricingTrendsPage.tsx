import React, { useState } from 'react';
import RoutePredictionPanel from '../components/RoutePredictionPanel';
import QuarterlyTrendsPanel from '../components/QuarterlyTrendsPanel';
import YearlyTrendsPanel from '../components/YearlyTrendsPanel';
import MacroMetricsPanel from '../components/MacroMetricsPanel';
import './PricingTrendsPage.css';

interface PricingTrendsPageProps {
  departureLocation: string;
  arrivalLocation: string;
  dateRange: { startDate: Date; endDate: Date };
  onDateChange: (range: { startDate: Date; endDate: Date }) => void;
  onBack: () => void;
}

const PricingTrendsPage: React.FC<PricingTrendsPageProps> = ({
  departureLocation,
  arrivalLocation,
  dateRange,
  onDateChange,
  onBack
}) => {
  const [actualPrice, setActualPrice] = useState<number | null>(null);
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);

  const handlePredictionResult = (actual: number | null, predicted: number | null) => {
    setActualPrice(actual);
    setPredictedPrice(predicted);
  };

  return (
    <div className="pricing-trends-container">
      <div className="pricing-trends-header">
        <button className="back-button" onClick={onBack}>
          &larr; Back to Search
        </button>
        <h1>Flight Price Analysis: {departureLocation} to {arrivalLocation}</h1>
      </div>

      <div className="pricing-trends-content">
        <div className="pricing-trends-row">
          <RoutePredictionPanel 
            departure={departureLocation.split(' ')[0]}
            arrival={arrivalLocation.split(' ')[0]}
            dateRange={dateRange}
            onDateChange={onDateChange}
            onPredictionResult={handlePredictionResult}
          />

          <div className="stacked-panels">
            <QuarterlyTrendsPanel 
              departure={departureLocation.split(' ')[0]} 
              arrival={arrivalLocation.split(' ')[0]} 
              dateRange={dateRange}
              predictedPrice={predictedPrice}
            />
            <YearlyTrendsPanel 
              departure={departureLocation.split(' ')[0]} 
              arrival={arrivalLocation.split(' ')[0]} 
              dateRange={dateRange}
              predictedPrice={predictedPrice}
            />
            <MacroMetricsPanel 
              dateRange={dateRange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingTrendsPage;

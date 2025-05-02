import React from 'react';
import './LocationSelector.css';

interface Airport {
  code: string;
  name: string;
}

interface LocationSelectorProps {
  departureLocation: string;
  arrivalLocation: string;
  airports: Airport[];
  availableDestinations: string[];
  selectedRoutePassengers?: number;
  selectedRouteFare?: number;
  onDepartureChange?: (location: string) => void;
  onArrivalChange?: (location: string) => void;
  onSearch?: () => void;
  loading?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  departureLocation,
  arrivalLocation,
  airports,
  availableDestinations,
  selectedRoutePassengers,
  onDepartureChange,
  onArrivalChange,
  onSearch
}) => {
  const handleDepartureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onDepartureChange) {
      onDepartureChange(e.target.value);
    }
  };

  const handleArrivalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onArrivalChange) {
      onArrivalChange(e.target.value);
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch();
    }
  };

  const isDepartureSelected = departureLocation !== 'Select departure';
  
  const isRouteSelected = departureLocation !== 'Select departure' && 
                          arrivalLocation !== 'Select arrival';
  
  const departureCode = isDepartureSelected ? departureLocation.split(' ')[0] : '';

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="location-selector">
      <div className="location-section">
        <h3>Departure</h3>
        <div className="location-dropdown">
          <select 
            value={departureLocation}
            onChange={handleDepartureChange}
            className="location-select"
          >
            <option value="Select departure">Select departure</option>
            {airports.map(airport => (
              <option key={airport.code} value={`${airport.code} (${airport.name})`}>
                {airport.code} ({airport.name})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="location-section">
        <h3>Arrival</h3>
        <div className="location-dropdown">
          <select 
            value={arrivalLocation}
            onChange={handleArrivalChange}
            className="location-select"
            disabled={!isDepartureSelected}
          >
            <option value="Select arrival">Select arrival</option>
            {isDepartureSelected && 
              airports
                .filter(airport => 
                  airport.code !== departureCode && 
                  availableDestinations.includes(airport.code)
                )
                .map(airport => (
                  <option key={airport.code} value={`${airport.code} (${airport.name})`}>
                    {airport.code} ({airport.name})
                  </option>
                ))
            }
          </select>
        </div>
      </div>

      {isRouteSelected && selectedRoutePassengers !== undefined && (
        <div className="passenger-count-display">
          <div className="passenger-count-label">Total Passengers</div>
          <div className="passenger-count-value">{formatNumber(selectedRoutePassengers)}</div>
        </div>
      )}

      <div className="search-button-container">
        <button 
          className="search-button" 
          onClick={handleSearchClick}
          disabled={departureLocation === 'Select departure' || arrivalLocation === 'Select arrival'}
        >
          View Data
        </button>
      </div>
    </div>
  );
};

export default LocationSelector;

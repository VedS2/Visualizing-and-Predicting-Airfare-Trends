import React, { useState, useEffect } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Line, 
  Marker 
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import './USAFlightMap.css';

// USA TopoJSON
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Airport coordinates [longitude, latitude]
const airportCoordinates: { [key: string]: [number, number] } = {
  'ABQ': [-106.6096, 35.0433], // Albuquerque
  'ATL': [-84.4277, 33.6407],  // Atlanta
  'AUS': [-97.6698, 30.1945],  // Austin
  'BNA': [-86.6781, 36.1263],  // Nashville
  'BOS': [-71.0062, 42.3656],  // Boston
  'BUR': [-118.3592, 34.2007], // Burbank
  'BWI': [-76.6683, 39.1774],  // Baltimore
  'CLE': [-81.8498, 41.4075],  // Cleveland
  'CLT': [-80.9431, 35.2140],  // Charlotte
  'DAL': [-96.8514, 32.8481],  // Dallas Love Field
  'DCA': [-77.0378, 38.8512],  // Washington Reagan
  'DEN': [-104.6737, 39.8561], // Denver
  'DFW': [-97.0403, 32.8998],  // Dallas/Fort Worth
  'DTW': [-83.3533, 42.2124],  // Detroit
  'EWR': [-74.1744, 40.6895],  // Newark
  'FLL': [-80.1522, 26.0742],  // Fort Lauderdale
  'HOU': [-95.2789, 29.6456],  // Houston Hobby
  'IAD': [-77.4565, 38.9531],  // Washington Dulles
  'IAH': [-95.3414, 29.9844],  // Houston
  'JFK': [-73.7781, 40.6413],  // New York JFK
  'LAS': [-115.1522, 36.0801], // Las Vegas
  'LAX': [-118.4085, 33.9416], // Los Angeles
  'LGA': [-73.8740, 40.7769],  // New York LaGuardia
  'MCO': [-81.3081, 28.4312],  // Orlando
  'MDW': [-87.7522, 41.7868],  // Chicago Midway
  'MIA': [-80.2870, 25.7951],  // Miami
  'MSP': [-93.2166, 44.8848],  // Minneapolis
  'MSY': [-90.2578, 29.9934],  // New Orleans
  'OAK': [-122.2197, 37.7214], // Oakland
  'ONT': [-117.6011, 34.0558], // Ontario
  'ORD': [-87.9073, 41.9742],  // Chicago O'Hare
  'PBI': [-80.0956, 26.6832],  // West Palm Beach
  'PDX': [-122.5975, 45.5887], // Portland
  'PHL': [-75.2407, 39.8721],  // Philadelphia
  'PHX': [-112.0115, 33.4352], // Phoenix
  'PVD': [-71.4338, 41.7267],  // Providence
  'RDU': [-78.7909, 35.8801],  // Raleigh-Durham
  'RSW': [-81.7552, 26.5362],  // Fort Myers
  'SAN': [-117.1933, 32.7338], // San Diego
  'SAT': [-98.4683, 29.5312],  // San Antonio
  'SEA': [-122.3088, 47.4502], // Seattle
  'SFO': [-122.3795, 37.6213], // San Francisco
  'SJC': [-121.9289, 37.3639], // San Jose
  'SLC': [-111.9790, 40.7899], // Salt Lake City
  'SMF': [-121.5916, 38.6955], // Sacramento
  'SNA': [-117.8683, 33.6757], // Santa Ana (Orange County)
  'STL': [-90.3700, 38.7487],  // St. Louis
  'TPA': [-82.5332, 27.9772],  // Tampa
};

const popularityScale = scaleLinear()
  .domain([0, 100])
  .range([1, 75]);

interface FlightRoute {
  from: string;
  to: string;
  popularity: number;
  passengerCount?: number;
  averageFare?: number;
  selected?: boolean;
}

interface USAFlightMapProps {
  selectedDeparture: string;
  selectedArrival: string;
  onRouteSelect?: (departure: string, arrival: string) => void;
}

const USAFlightMap: React.FC<USAFlightMapProps> = ({ 
  selectedDeparture, 
  selectedArrival, 
  onRouteSelect 
}) => {
  const [routes, setRoutes] = useState<FlightRoute[]>([]);
  const [allRoutes, setAllRoutes] = useState<FlightRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    content: string;
    position: { x: number; y: number };
  } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:3000/api/routes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch routes: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Fetched routes:", data);
        setRoutes(data);
        setAllRoutes(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError('Failed to load routes.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoutes();
  }, []);

  const getDepartureCode = () => selectedDeparture.split(' ')[0];
  const getArrivalCode = () => selectedArrival.split(' ')[0];

  useEffect(() => {
    const departureCode = getDepartureCode();
    const arrivalCode = getArrivalCode();
    
    const hasValidSelection = Boolean(
      departureCode &&
      arrivalCode &&
      departureCode !== arrivalCode &&
      departureCode !== 'Select' &&
      arrivalCode !== 'Select'
    );
    
    setHasSelection(hasValidSelection);
    
    if (hasValidSelection) {
      const selectedRoute = allRoutes.find(route => 
        (route.from === departureCode && route.to === arrivalCode) ||
        (route.from === arrivalCode && route.to === departureCode)
      );
      
      if (selectedRoute) {
        setRoutes([{
          ...selectedRoute,
          selected: true
        }]);
      } else {
        setRoutes(allRoutes.map(route => ({
          ...route,
          selected: (route.from === departureCode && route.to === arrivalCode) ||
                    (route.from === arrivalCode && route.to === departureCode)
        })));
      }
    } else {
      setRoutes(allRoutes);
    }
  }, [selectedDeparture, selectedArrival, allRoutes]);

  const handleRouteClick = (route: FlightRoute) => {
    if (onRouteSelect) {
      const departureCode = getDepartureCode();
      const arrivalCode = getArrivalCode();
      
      if ((route.from === departureCode && route.to === arrivalCode) ||
          (route.from === arrivalCode && route.to === departureCode)) {
        onRouteSelect('Select departure', 'Select arrival');
      } else {
        onRouteSelect(`${route.from} (${getAirportName(route.from)})`, 
                      `${route.to} (${getAirportName(route.to)})`);
      }
    }
  };

  const getAirportName = (code: string) => {
    const airports: {[key: string]: string} = {
      'ABQ': 'Albuquerque',
      'ATL': 'Atlanta',
      'AUS': 'Austin',
      'BNA': 'Nashville',
      'BOS': 'Boston',
      'BUR': 'Burbank',
      'BWI': 'Baltimore',
      'CLE': 'Cleveland',
      'CLT': 'Charlotte',
      'DAL': 'Dallas Love Field',
      'DCA': 'Washington Reagan',
      'DEN': 'Denver',
      'DFW': 'Dallas',
      'DTW': 'Detroit',
      'EWR': 'Newark',
      'FLL': 'Fort Lauderdale',
      'HOU': 'Houston Hobby',
      'IAD': 'Washington DC',
      'IAH': 'Houston',
      'JFK': 'New York JFK',
      'LAS': 'Las Vegas',
      'LAX': 'Los Angeles',
      'LGA': 'New York LaGuardia',
      'MCO': 'Orlando',
      'MDW': 'Chicago Midway',
      'MIA': 'Miami',
      'MSP': 'Minneapolis',
      'MSY': 'New Orleans',
      'OAK': 'Oakland',
      'ONT': 'Ontario',
      'ORD': 'Chicago',
      'PBI': 'West Palm Beach',
      'PDX': 'Portland',
      'PHL': 'Philadelphia',
      'PHX': 'Phoenix',
      'PVD': 'Providence',
      'RDU': 'Raleigh-Durham',
      'RSW': 'Fort Myers',
      'SAN': 'San Diego',
      'SAT': 'San Antonio',
      'SEA': 'Seattle',
      'SFO': 'San Francisco',
      'SJC': 'San Jose',
      'SLC': 'Salt Lake City',
      'SMF': 'Sacramento',
      'SNA': 'Santa Ana',
      'STL': 'St. Louis',
      'TPA': 'Tampa'
    };
    return airports[code] || code;
  };

  const getVisibleAirports = () => {
    const usedAirports = new Set<string>();
    
    routes.forEach(route => {
      usedAirports.add(route.from);
      usedAirports.add(route.to);
    });
    
    return usedAirports;
  };

  const visibleAirports = getVisibleAirports();

  return (
    <div className="usa-flight-map">
      {error && <div className="error-message">{error}</div>}
      
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#EAEAEC"
                stroke="#D6D6DA"
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", cursor: "default" },
                  pressed: { outline: "none" }
                }}
                pointerEvents="none"
              />
            ))
          }
        </Geographies>

        {routes.map((route) => {
          if (airportCoordinates[route.from] && airportCoordinates[route.to]) {
            const routeId = `${route.from}-${route.to}`;
            const isHovered = hoveredRoute === routeId;
            const isSelected = route.selected;
            
            const lineWidth = popularityScale(route.popularity);
            
            return (
              <Line
                key={routeId}
                from={airportCoordinates[route.from]}
                to={airportCoordinates[route.to]}
                stroke={isSelected ? "#FF0000" : "#0066FF"}
                strokeWidth={isHovered ? lineWidth + 1 : lineWidth}
                strokeLinecap="round"
                strokeDasharray="4, 4"
                className={`flight-route ${isSelected ? 'blinking-line' : ''}`}
                onMouseEnter={(evt) => {
                  setHoveredRoute(routeId);
                  const formatNumber = (num: number) => num.toLocaleString();
                  setTooltip({
                    content: `
                      <strong>${route.from} → ${route.to}</strong><br/>
                      Passengers: ${formatNumber(route.passengerCount || 0)}<br/>
                      Avg. Fare: $${route.averageFare?.toFixed(2) || 'N/A'}
                    `,
                    position: {
                      x: evt.clientX,
                      y: evt.clientY
                    }
                  });
                }}
                onMouseMove={(evt) => {
                  if (tooltip) {
                    setTooltip({
                      ...tooltip,
                      position: {
                        x: evt.clientX,
                        y: evt.clientY
                      }
                    });
                  }
                }}
                onMouseLeave={() => {
                  setHoveredRoute(null);
                  setTooltip(null);
                }}
                onClick={() => handleRouteClick(route)}
                style={{ cursor: 'pointer' }}
              />
            );
          }
          return null;
        })}

        {Object.entries(airportCoordinates).map(([code, coordinates]) => {
          const isUsed = visibleAirports.has(code);
          
          if (!isUsed) return null;
          
          const departureCode = getDepartureCode();
          const arrivalCode = getArrivalCode();
          const isSelected = code === departureCode || code === arrivalCode;
          
          return (
            <Marker key={code} coordinates={coordinates}>
              <circle
                r={isSelected ? 6 : 4}
                fill={isSelected ? "#FF0000" : "#0066FF"}
                stroke="#fff"
                strokeWidth={2}
                className="airport-marker"
              />
              <text
                textAnchor="middle"
                y={-10}
                style={{
                  fontFamily: "system-ui",
                  fontSize: "10px",
                  fontWeight: isSelected ? "bold" : "normal",
                  fill: "#333"
                }}
              >
                {code}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#0066FF" }}></div>
          <span>Available Routes</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#FF0000" }}></div>
          <span>Selected Route</span>
        </div>
      </div>
      
      {hasSelection && (
        <button 
          className="clear-selection-button"
          onClick={() => onRouteSelect && onRouteSelect('Select departure', 'Select arrival')}
        >
          Show All Routes
        </button>
      )}
    </div>
  );
};

export default USAFlightMap;

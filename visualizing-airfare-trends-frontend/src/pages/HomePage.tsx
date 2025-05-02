import React, { useState, useEffect } from "react";
import CalendarComponent from "../components/CalendarComponent";
import LocationSelector from "../components/LocationSelector";
import USAFlightMap from "../components/USAFlightMap";
import PricingTrendsPage from "./PricingTrendsPage";
import "./HomePage.css";

interface Airport {
  code: string;
  name: string;
}

interface FlightRoute {
  from: string;
  to: string;
  popularity: number;
  passengerCount?: number;
  averageFare?: number;
}

const HomePage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7))
  });

  const [departureLocation, setDepartureLocation] = useState("Select departure");
  const [arrivalLocation, setArrivalLocation] = useState("Select arrival");
  const [showPricingTrends, setShowPricingTrends] = useState(false);

  const [airports, setAirports] = useState<Airport[]>([]);
  const [routes, setRoutes] = useState<FlightRoute[]>([]);
  const [availableDestinations, setAvailableDestinations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://127.0.0.1:3000/api/routes');

        if (!response.ok) {
          throw new Error(`Failed to fetch routes: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setRoutes(data);

        const airportSet = new Set<string>();
        data.forEach((route: FlightRoute) => {
          airportSet.add(route.from);
          airportSet.add(route.to);
        });

        const airportList: Airport[] = Array.from(airportSet).map(code => ({
          code,
          name: getAirportName(code)
        }));

        airportList.sort((a, b) => a.code.localeCompare(b.code));
        setAirports(airportList);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    if (departureLocation === 'Select departure') {
      setAvailableDestinations([]);
      return;
    }

    const departureCode = departureLocation.split(' ')[0];

    const destinations = routes
      .filter(route => route.from === departureCode || route.to === departureCode)
      .map(route => route.from === departureCode ? route.to : route.from);

    setAvailableDestinations([...new Set(destinations)]);

    if (arrivalLocation !== 'Select arrival') {
      const arrivalCode = arrivalLocation.split(' ')[0];
      if (!destinations.includes(arrivalCode)) {
        setArrivalLocation('Select arrival');
      }
    }
  }, [departureLocation, routes]);

  const getSelectedRoutePassengers = () => {
    if (departureLocation === 'Select departure' || arrivalLocation === 'Select arrival') return undefined;

    const departureCode = departureLocation.split(' ')[0];
    const arrivalCode = arrivalLocation.split(' ')[0];

    const route = routes.find(r =>
      (r.from === departureCode && r.to === arrivalCode) ||
      (r.from === arrivalCode && r.to === departureCode)
    );

    return route?.passengerCount;
  };

  const getSelectedRouteFare = () => {
    if (departureLocation === 'Select departure' || arrivalLocation === 'Select arrival') return undefined;

    const departureCode = departureLocation.split(' ')[0];
    const arrivalCode = arrivalLocation.split(' ')[0];

    const route = routes.find(r =>
      (r.from === departureCode && r.to === arrivalCode) ||
      (r.from === arrivalCode && r.to === departureCode)
    );

    return route?.averageFare;
  };

  const getAirportName = (code: string) => {
    const airports: { [key: string]: string } = {
      'ABQ': 'Albuquerque', 'ATL': 'Atlanta', 'AUS': 'Austin', 'BNA': 'Nashville', 'BOS': 'Boston',
      'BUR': 'Burbank', 'BWI': 'Baltimore', 'CLE': 'Cleveland', 'CLT': 'Charlotte', 'DAL': 'Dallas Love Field',
      'DCA': 'Washington Reagan', 'DEN': 'Denver', 'DFW': 'Dallas', 'DTW': 'Detroit', 'EWR': 'Newark',
      'FLL': 'Fort Lauderdale', 'HOU': 'Houston Hobby', 'IAD': 'Washington DC', 'IAH': 'Houston',
      'JFK': 'New York JFK', 'LAS': 'Las Vegas', 'LAX': 'Los Angeles', 'LGA': 'New York LaGuardia',
      'MCO': 'Orlando', 'MDW': 'Chicago Midway', 'MIA': 'Miami', 'MSP': 'Minneapolis', 'MSY': 'New Orleans',
      'OAK': 'Oakland', 'ONT': 'Ontario', 'ORD': 'Chicago', 'PBI': 'West Palm Beach', 'PDX': 'Portland',
      'PHL': 'Philadelphia', 'PHX': 'Phoenix', 'PVD': 'Providence', 'RDU': 'Raleigh-Durham', 'RSW': 'Fort Myers',
      'SAN': 'San Diego', 'SAT': 'San Antonio', 'SEA': 'Seattle', 'SFO': 'San Francisco', 'SJC': 'San Jose',
      'SLC': 'Salt Lake City', 'SMF': 'Sacramento', 'SNA': 'Santa Ana', 'STL': 'St. Louis', 'TPA': 'Tampa'
    };

    return airports[code] || code;
  };

  const handleDateChange = (range: { startDate: Date; endDate: Date }) => setDateRange(range);
  const handleDepartureChange = (loc: string) => {
    setDepartureLocation(loc);
    if (loc === 'Select departure') setArrivalLocation('Select arrival');
  };
  const handleArrivalChange = (loc: string) => setArrivalLocation(loc);
  const handleRouteSelect = (dep: string, arr: string) => {
    setDepartureLocation(dep);
    setArrivalLocation(arr);
  };

  const handleSearch = () => {
    setShowPricingTrends(true);
  };

  const handleBackToSearch = () => setShowPricingTrends(false);

  if (showPricingTrends) {
    return (
      <PricingTrendsPage
        departureLocation={departureLocation}
        arrivalLocation={arrivalLocation}
        dateRange={dateRange}
        onDateChange={handleDateChange}
        onBack={handleBackToSearch}
      />
    );
  }

  return (
    <div className="homepage-container">
      <div className="homepage-content-row">
        <div className="map-column">
          <h1 className="map-title">Visualizing Airfare Trends ✈️</h1>
          <USAFlightMap 
            selectedDeparture={departureLocation}
            selectedArrival={arrivalLocation}
            onRouteSelect={handleRouteSelect}
          />
        </div>

        <div className="sidebar-column">
          <div className="calendar-box">
            <CalendarComponent 
              onDateChange={handleDateChange}
              initialDateRange={dateRange}
            />
          </div>

          <div className="location-box">
            <LocationSelector
              departureLocation={departureLocation}
              arrivalLocation={arrivalLocation}
              airports={airports}
              availableDestinations={availableDestinations}
              selectedRoutePassengers={getSelectedRoutePassengers()}
              selectedRouteFare={getSelectedRouteFare()}
              onDepartureChange={handleDepartureChange}
              onArrivalChange={handleArrivalChange}
              onSearch={handleSearch}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

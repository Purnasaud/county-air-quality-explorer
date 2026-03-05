// ArcGIS API Configuration
export const ARCGIS_API_KEY = "AAPTxy8BH1VEsoebNVZXo8HurJePK6lAVAuvJ7hRg1crmH9BuwWa7iBtNoNmDh7C8Fv3wQ2qFB_Ti2O_d1hd5nsjPzDDk2wx2XxJCyxDNMYR5RguvOs6n9ry3_cG6oSwRq6FRaiJL3quMrBLdsmX6AzTADd3xlKj2fAANjWv4wJQZb-lTXzjEtQaaPEunt0ZiEs0hJSin3IoWPPOUGQ5zSoydIav7DHLaK3ALgxPMyZokHU.AT1_XxmWFdII";

// Data Layer Configuration
export const LAYERS = {
  AIRNOW_MONITORS: {
    url: "https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Air%20Now%20Current%20Monitor%20Data%20Public/FeatureServer/0",
    title: "AirNow Real-Time Air Quality Monitors",
    refreshInterval: 60,
    outFields: ["*"],
    popupEnabled: true
  },

  COUNTY_EMISSIONS: {
    url: "https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/NEI_2020_for_County_Level_Emissions_US_EPA_OAR_OAQPS/FeatureServer/0",
    title: "2020 NEI County Emissions",
    opacity: 0.7,
    outFields: ["*"]
  }
};

// AQI Category Thresholds and Colors (EPA Standard)
export const AQI_CATEGORIES = [
  { min: 0, max: 50, label: "Good", color: "#00e400", textColor: "#000000", description: "Air quality is satisfactory" },
  { min: 51, max: 100, label: "Moderate", color: "#ffff00", textColor: "#000000", description: "Acceptable for most people" },
  { min: 101, max: 150, label: "Unhealthy for Sensitive Groups", color: "#ff7e00", textColor: "#000000", description: "Sensitive groups may experience health effects" },
  { min: 151, max: 200, label: "Unhealthy", color: "#ff0000", textColor: "#ffffff", description: "Everyone may begin to experience health effects" },
  { min: 201, max: 300, label: "Very Unhealthy", color: "#8f3f97", textColor: "#ffffff", description: "Health alert: everyone may experience more serious effects" },
  { min: 301, max: 500, label: "Hazardous", color: "#7e0023", textColor: "#ffffff", description: "Health warning of emergency conditions" }
];

// Get AQI category from value
export const getAQICategory = (aqi) => {
  if (aqi == null || aqi < 0) return null;
  return AQI_CATEGORIES.find(cat => aqi >= cat.min && aqi <= cat.max) || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
};

// Map Initial View Settings
export const MAP_CONFIG = {
  basemap: "streets-navigation-vector",
  center: [-98, 39],
  zoom: 4,
  constraints: {
    minZoom: 3,
    maxZoom: 18
  }
};

// Pollutant Display Configuration
export const POLLUTANTS = {
  OZONE: { field: "OZONE_AQI_SORT", label: "Ozone", unit: "ppb", color: "#4FC3F7" },
  PM25: { field: "PM25_AQI_SORT", label: "PM2.5", unit: "μg/m³", color: "#FF9800" },
  PM10: { field: "PM10_AQI_SORT", label: "PM10", unit: "μg/m³", color: "#9C27B0" }
};


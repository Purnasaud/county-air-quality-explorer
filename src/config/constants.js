// ArcGIS API Configuration
// Leave empty string for public services - passing a key to public services causes "Invalid token"
export const ARCGIS_API_KEY = "";

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
  { min: 0,   max: 50,  label: "Good",                            color: [0, 228, 0],       textColor: "#000000" },
  { min: 51,  max: 100, label: "Moderate",                        color: [255, 255, 0],     textColor: "#000000" },
  { min: 101, max: 150, label: "Unhealthy for Sensitive Groups",  color: [255, 126, 0],     textColor: "#ffffff" },
  { min: 151, max: 200, label: "Unhealthy",                       color: [255, 0, 0],       textColor: "#ffffff" },
  { min: 201, max: 300, label: "Very Unhealthy",                  color: [143, 63, 151],    textColor: "#ffffff" },
  { min: 301, max: 500, label: "Hazardous",                       color: [126, 0, 35],      textColor: "#ffffff" }
];

// Get AQI category from value
export const getAQICategory = (aqi) => {
  if (aqi == null || aqi < 0) return null;
  return AQI_CATEGORIES.find(cat => aqi >= cat.min && aqi <= cat.max) 
    || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
};

// Map Initial View Settings
export const MAP_CONFIG = {
  basemap: "gray-vector",
  center: [-98, 39.5],
  zoom: 4,
  constraints: {
    minZoom: 3,
    maxZoom: 18
  }
};

// Pollutant Display Configuration
export const POLLUTANTS = {
  OZONE: { field: "OZONE_AQI_SORT", label: "Ozone",  unit: "ppb",    color: "#4FC3F7" },
  PM25:  { field: "PM25_AQI_SORT",  label: "PM2.5",  unit: "μg/m³",  color: "#FF9800" },
  PM10:  { field: "PM10_AQI_SORT",  label: "PM10",   unit: "μg/m³",  color: "#9C27B0" }
};

// Emissions Categories for Charts
export const EMISSIONS_CATEGORIES = {
  CAP: {
    label: "Criteria Air Pollutants",
    color: "#667eea",
    fields: [
      'CAP__Carbon_Monoxide__Polluta_4',
      'CAP__Lead__Pollutant_Code__7441',
      'CAP__Ammonia__Pollutant_Code__4',
      'CAP__Nitrogen_Oxides__Polluta_4',
      'CAP__Sulfur_Dioxide__Pollutan_3',
      'CAP__Volatile_Organic_Compoun_4',
      'CAP__PM10_Primary__Filt___Con_1',
      'CAP__PM2_5_Primary__Filt___Co_4'
    ]
  },
  HAP: {
    label: "Hazardous Air Pollutants",
    color: "#ff7f0e",
    prefix: 'HAP__'
  },
  GHG: {
    label: "Greenhouse Gases",
    color: "#2ca02c",
    fields: [
      'GHG__Carbon_Dioxide__Pollutant_',
      'GHG__Methane__Pollutant_Code__C',
      'GHG__Nitrous_Oxide__Pollutant_C',
      'GHG__Sulfur_Hexafluoride__Pollu'
    ]
  },
  PFAS: {
    label: "PFAS Compounds",
    color: "#d62728",
    prefix: 'PFAS__'
  },
  OTHER: {
    label: "Other Emissions",
    color: "#9467bd"
  }
};

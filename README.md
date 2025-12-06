# 🌍 County Air Quality Explorer
## 🎯 Project Overview

This web-based GIS dashboard for U.S. county air quality uniquely combines real-time EPA data with emissions data, enabling users to monitor conditions in their area and make informed decisions. By integrating both live AQI readings—ozone, PM2.5, and PM10—from EPA AirNow stations and 2020 NEI county emissions totals, the platform offers a comprehensive view not available in standard dashboards. Users can search for counties, click on map features, and view detailed information panels to easily track and compare air quality and emissions across regions. Built with React and the ArcGIS Maps SDK for JavaScript, the tool highlights areas with poor air quality and high emissions, empowering users to take personal, community, or policy action.


## Key Features

- ***Real-time AQI Monitoring***: The interactive map displays EPA AirNow monitoring stations that update hourly. Markers, clustered by proximity, indicate current AQI levels for ozone or PM. Selecting a station reveals its name, EPA AQS ID, current pollutant concentrations, and NowCast AQI (e.g., the “Laurel Hill” site shows precise readings and context).
- ***Search Bar***: Users can quickly search and zoom to any county by entering its name, simplifying map navigation and data access.
- ***Info Panel & Pop-ups***: Each pop-up displays a county summary, including the current highest AQI, main pollutants, and the number and status of monitoring stations. Additional details include the latest update time, the total number of active monitors, and a pie chart (using Chart.js) for each county showing 2020 emissions by pollutant category. Pollutant categories include criteria air pollutants (CAP), greenhouse gases (GHG), hazardous air pollutants (HAP), perfluoroalkyl and polyfluoroalkyl substances (PFAS), particulate matter (PM species), and other pollutant groups. 
- ***Map Interaction***: The standards map enables users to zoom, pan, and toggle controls basemaps, monitoring stations, and emissions layers using standard ArcGIS JS API tools. The legend displays official AQI color codes and values: green for Good, yellow for Moderate, orange for Unhealthy for Sensitive Groups, red for Unhealthy, purple for Very Unhealthy, and maroon for Hazardous.
- ***Info Panels*** :Detailed information about current statistics, including total number of active Monitors, Average AQI, Data Source, and Latest updated times, with a toggle instructions panel showing how to use the guide. 

## Data Sources:
- ***EPA AirNow (Live AQI)***: Real-time point data for ozone and particulate matter (PM2.5/10) from EPA’s AirNow program. This feature service updates hourly and provides current AQI readings by station.
- ***EPA 2020 NEI (Emissions)***: County-level annual emissions totals (CAPs and HAPs) from the U.S. EPA’s 2020 National Emissions Inventory (epa.gov). These static datasets (imported via ArcGIS Online or JSON) provide context on sources of pollution.
- ***U.S. County Boundaries***: Polygon layer (Census TIGER 2020 or ArcGIS Living Atlas) to join and display county attributes.

### Technologies Used
- ***React*** (frontend framework) with functional components and hooks.
- ***Esri ArcGIS Maps SDK for JavaScript (v4.x)*** powers mapping. ArcGIS offers FeatureLayers, clustering, pop-ups, and spatial queries. The app uses an ArcGIS API key for basemaps and retrieves data via ArcGIS Online feature services.
- ***Chart.js*** is has been used to render emissions pie charts using HTML5 canvases.
- ***CSS/HTML5*** and simple UI libraries (e.g., Flexbox layout). No backend server – all data is fetched directly from EPA/ArcGIS services.
- ***No backend server*** All data fetched client-side vis ArcGIS services


## 📝 License

This project is for educational purposes as part of GIST-5300 Web Mapping and Internet GIS course at the University of Wyoming.

## 👤 Author

**Purna Saud**  
M.Sc. Student in GIS & Cartography  
Graduate Research Assistant  
School of Computing, University of Wyoming  
Email: psaud@uwyo.edu

## 📚 References

- [EPA AirNow](https://www.airnow.gov/)
- [2020 National Emissions Inventory](https://www.epa.gov/air-emissions-inventories/2020-national-emissions-inventory-nei-data)
- [ArcGIS Maps SDK for JavaScript](https://developers.arcgis.com/javascript/)
- [Chart.js Documentation](https://www.chartjs.org/)

---

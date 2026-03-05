import React, { useRef, useEffect, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Legend from '@arcgis/core/widgets/Legend';
import Home from '@arcgis/core/widgets/Home';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import Expand from '@arcgis/core/widgets/Expand';
//import esriConfig from '@arcgis/core/config';
import esriConfig from "@arcgis/core/config.js";
import Chart from 'chart.js/auto';
import SearchBar from './SearchBar';
import { 
  ARCGIS_API_KEY, 
  LAYERS, 
  MAP_CONFIG, 
  getAQICategory, 
  AQI_CATEGORIES,
} from '../config/constants';

// Monitor fields (from AirNow layer)
const MONITOR_FIELDS = {
  OZONE_SORT: 'OZONE_AQI_SORT',
  PM25_SORT: 'PM25_AQI_SORT',
  PM10_SORT: 'PM10_AQI_SORT',
  
  OZONE_LABEL: 'OZONE_AQI_LABEL',
  PM25_LABEL: 'PM25_AQI_LABEL',
  PM10_LABEL: 'PM10_AQI_LABEL',

  OZONE_CONC: 'OZONE',
  OZONE_UNIT: 'OZONE_Unit',
  PM25_CONC: 'PM25',
  PM25_UNIT: 'PM25_Unit',
  PM10_CONC: 'PM10',
  PM10_UNIT: 'PM10_Unit',

  AQS_ID: 'AQSID',
  DATA_SOURCE: 'DataSource',
  LOCAL_TIME: 'LocalTimeString',
  GMT_OFFSET: 'GMTOffset',
  SITE_NAME: 'SiteName',
  STATE_NAME: 'StateName'
};

const COUNTY_FIELDS = {
  TOTAL_EMISSIONS: 'Total_County_Emissions_TON'
};

const getAQICssColor = (cat) => {
  if (!cat || !cat.color) return null;
  const c = cat.color;
  if (Array.isArray(c)) {
    if (c.length === 3) return `rgba(${c[0]},${c[1]},${c[2]},1)`;
    if (c.length === 4) return `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;
    return `rgba(${c.join(',')})`;
  }
  return c;
};

const SECTOR_LABELS = {
  POINT: 'Point Sources',
  NONPOINT: 'Nonpoint Sources',
  ONROAD: 'On-road Mobile',
  NONROAD: 'Non-road Mobile'
};

const POLLUTANT_LABELS = {
  CO:   'CO (Carbon Monoxide)',
  NOX:  'NOₓ (Nitrogen Oxides)',
  SO2:  'SO₂ (Sulfur Dioxide)',
  PM25: 'PM₂.₅ Primary',
  PM10: 'PM₁₀ Primary',
  VOC:  'VOCs (Volatile Organic Compounds)',
  NH3:  'NH₃ (Ammonia)',
  PB:   'Pb (Lead)'
};

const SECTOR_FIELDS = {
  POINT: [
    'CAP__Carbon_Monoxide__Polluta_3',
    'CAP__Nitrogen_Oxides__Polluta_3',
    'CAP__Sulfur_Dioxide__Pollutan_2',
    'CAP__Volatile_Organic_Compoun_3',
    'CAP__PM10_Primary__Filt___Con_3',
    'CAP__PM2_5_Primary__Filt___Co_3',
    'CAP__Ammonia__Pollutant_Code__3',
    'CAP__Lead__Pollutant_Code__7440'
  ],
  NONPOINT: [
    'CAP__Carbon_Monoxide__Pollutant',
    'CAP__Nitrogen_Oxides__Pollutant',
    'CAP__Sulfur_Dioxide__Pollutant_',
    'CAP__Volatile_Organic_Compounds',
    'CAP__PM10_Primary__Filt___Con_2',
    'CAP__PM2_5_Primary__Filt___Cond',
    'CAP__Ammonia__Pollutant_Code__N',
    'CAP__Lead__Pollutant_Code__7439'
  ],
  ONROAD: [
    'CAP__Carbon_Monoxide__Polluta_2',
    'CAP__Nitrogen_Oxides__Polluta_2',
    'CAP__Sulfur_Dioxide__Pollutan_1',
    'CAP__Volatile_Organic_Compoun_2',
    'CAP__PM10_Primary__Filt___Cond1',
    'CAP__PM2_5_Primary__Filt___Co_2',
    'CAP__Ammonia__Pollutant_Code__2'
  ],
  NONROAD: [
    'CAP__Carbon_Monoxide__Polluta_1',
    'CAP__Nitrogen_Oxides__Polluta_1',
    'CAP__Sulfur_Dioxide__Pollutant1',
    'CAP__Volatile_Organic_Compoun_1',
    'CAP__PM10_Primary__Filt___Cond_',
    'CAP__PM2_5_Primary__Filt___Co_1',
    'CAP__Ammonia__Pollutant_Code__1'
  ]
};

const POLLUTANT_TOTAL_FIELDS = {
  CO:   'CAP__Carbon_Monoxide__Polluta_4',
  NOX:  'CAP__Nitrogen_Oxides__Polluta_4',
  SO2:  'CAP__Sulfur_Dioxide__Pollutan_3',
  PM25: 'CAP__PM2_5_Primary__Filt___Co_4',
  PM10: 'CAP__PM10_Primary__Filt___Con_1',
  VOC:  'CAP__Volatile_Organic_Compoun_4',
  NH3:  'CAP__Ammonia__Pollutant_Code__4',
  PB:   'CAP__Lead__Pollutant_Code__7441'
};

const GROUP_LABELS = {
  CAP: 'CAP (Criteria Air Pollutants)',
  GHG: 'GHG (Greenhouse Gases)',
  HAP: 'HAP (Hazardous Air Pollutants)',
  PFAS: 'PFAS',
  PM_SPECIES: 'PM Species Composition',
  OTHER: 'Other Pollutants'
};

function MapViewComponent() {
  const mapDiv = useRef(null);
  const monitorsLayerRef = useRef(null);
  const emissionsLayerRef = useRef(null);
  const viewRef = useRef(null);
  const chartInstanceRef = useRef([]);

  const isStationPopupRef = useRef(false);
  const lastHoverStationIdRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [statistics, setStatistics] = useState({
    totalMonitors: 0,
    avgAQI: 0,
    alertCounties: 0,
    lastUpdated: null
  });
  const [layerVisibility, setLayerVisibility] = useState({
    emissions: true,
    monitors: true
  });
  const [currentBasemap, setCurrentBasemap] = useState('osm');

  const getMaxAQIFromAttrs = (attrs) => {
    const pollutants = [
      { name: 'Ozone',  sortField: MONITOR_FIELDS.OZONE_SORT, labelField: MONITOR_FIELDS.OZONE_LABEL },
      { name: 'PM2.5',  sortField: MONITOR_FIELDS.PM25_SORT, labelField: MONITOR_FIELDS.PM25_LABEL },
      { name: 'PM10',   sortField: MONITOR_FIELDS.PM10_SORT, labelField: MONITOR_FIELDS.PM10_LABEL }
    ];

    let maxAQI = -Infinity;
    let maxPollutant = null;
    let maxValue = null;

    pollutants.forEach(p => {
      const sortValue = attrs[p.sortField];
      const labelValue = attrs[p.labelField];
      
      if (sortValue != null && sortValue !== -999 && sortValue > 0) {
        const labelStr = String(labelValue ?? '').trim().toUpperCase();
        if (labelValue != null && labelStr !== 'ND' && labelStr !== '') {
          const aqiValue = Number(sortValue);
          if (!Number.isNaN(aqiValue) && aqiValue > maxAQI) {
            maxAQI = aqiValue;
            maxPollutant = p.name;
            maxValue = aqiValue;
          }
        }
      }
    });

    if (maxAQI === -Infinity || maxAQI <= 0) return null;
    return { maxAQI, pollutant: maxPollutant, value: Math.round(maxValue) };
  };

  const displayCountyPopup = (graphic) => {
    const view = viewRef.current;
    const monitorsLayer = monitorsLayerRef.current;

    if (!view || !monitorsLayer) return;

    monitorsLayer.queryFeatures({
      geometry: graphic.geometry,
      spatialRelationship: 'intersects',
      outFields: [
        MONITOR_FIELDS.OZONE_SORT,
        MONITOR_FIELDS.OZONE_LABEL,
        MONITOR_FIELDS.PM25_SORT,
        MONITOR_FIELDS.PM25_LABEL,
        MONITOR_FIELDS.PM10_SORT,
        MONITOR_FIELDS.PM10_LABEL,
        MONITOR_FIELDS.OZONE_CONC,
        MONITOR_FIELDS.OZONE_UNIT,
        MONITOR_FIELDS.PM25_CONC,
        MONITOR_FIELDS.PM25_UNIT,
        MONITOR_FIELDS.PM10_CONC,
        MONITOR_FIELDS.PM10_UNIT,
        MONITOR_FIELDS.LOCAL_TIME
      ],
      returnGeometry: false
    }).then((res) => {
      let countyMaxAQI = null;
      let countyMainPollutant = 'N/A';
      let countyMainValue = 'N/A';
      let validMonitorCount = 0;

      let countyConcValue = null;
      let countyConcUnit = null;
      let countyUpdateTime = null;

      res.features.forEach((feature) => {
        const attrs = feature.attributes;
        const monitorData = getMaxAQIFromAttrs(attrs);
        
        if (monitorData) {
          validMonitorCount++;
          if (countyMaxAQI === null || monitorData.maxAQI > countyMaxAQI) {
            countyMaxAQI = monitorData.maxAQI;
            countyMainPollutant = monitorData.pollutant;
            countyMainValue = monitorData.value;

            if (monitorData.pollutant === 'Ozone') {
              countyConcValue = attrs[MONITOR_FIELDS.OZONE_CONC];
              countyConcUnit  = attrs[MONITOR_FIELDS.OZONE_UNIT];
            } else if (monitorData.pollutant === 'PM2.5') {
              countyConcValue = attrs[MONITOR_FIELDS.PM25_CONC];
              countyConcUnit  = attrs[MONITOR_FIELDS.PM25_UNIT];
            } else if (monitorData.pollutant === 'PM10') {
              countyConcValue = attrs[MONITOR_FIELDS.PM10_CONC];
              countyConcUnit  = attrs[MONITOR_FIELDS.PM10_UNIT];
            }

            countyUpdateTime = attrs[MONITOR_FIELDS.LOCAL_TIME] || null;
          }
        }
      });

      const attrs = graphic.attributes;

      const sectorTotals = {
        POINT: 0,
        NONPOINT: 0,
        ONROAD: 0,
        NONROAD: 0
      };

      Object.entries(SECTOR_FIELDS).forEach(([sectorKey, fieldList]) => {
        fieldList.forEach((fieldName) => {
          const v = Number(attrs[fieldName]);
          if (Number.isFinite(v)) {
            sectorTotals[sectorKey] += v;
          }
        });
      });

      const totalSectorEmissions =
        sectorTotals.POINT +
        sectorTotals.NONPOINT +
        sectorTotals.ONROAD +
        sectorTotals.NONROAD;

      const pollutantTotals = {
        CO: 0,
        NOX: 0,
        SO2: 0,
        PM25: 0,
        PM10: 0,
        VOC: 0,
        NH3: 0,
        PB: 0
      };

      Object.entries(POLLUTANT_TOTAL_FIELDS).forEach(([pollKey, fieldName]) => {
        const v = Number(attrs[fieldName]);
        if (Number.isFinite(v)) {
          pollutantTotals[pollKey] += v;
        }
      });

      const totalPollEmissions = Object.values(pollutantTotals)
        .reduce((a, b) => a + b, 0);

      const groupTotals = {
        CAP: 0,
        GHG: 0,
        HAP: 0,
        PFAS: 0,
        PM_SPECIES: 0,
        OTHER: 0
      };

      Object.values(POLLUTANT_TOTAL_FIELDS).forEach((fieldName) => {
        const v = Number(attrs[fieldName]);
        if (Number.isFinite(v)) {
          groupTotals.CAP += v;
        }
      });

      Object.entries(attrs).forEach(([field, rawVal]) => {
        const v = Number(rawVal);
        if (!Number.isFinite(v) || v === 0) return;

        if (field.startsWith('GHG__')) {
          groupTotals.GHG += v;
        } else if (field.startsWith('HAP__')) {
          groupTotals.HAP += v;
        } else if (field.startsWith('PFAS__')) {
          groupTotals.PFAS += v;
        } else if (field.startsWith('PM_Species_Comp__')) {
          groupTotals.PM_SPECIES += v;
        } else if (field.startsWith('Other__')) {
          groupTotals.OTHER += v;
        }
      });

      const pollutantSums = [];

      Object.entries(POLLUTANT_TOTAL_FIELDS).forEach(([pollKey, fieldName]) => {
        const v = Number(attrs[fieldName]);
        if (Number.isFinite(v) && v > 0) {
          pollutantSums.push({
            label: POLLUTANT_LABELS[pollKey] || pollKey,
            value: v
          });
        }
      });

      Object.entries(attrs).forEach(([field, rawVal]) => {
        const v = Number(rawVal);
        if (!Number.isFinite(v) || v <= 0) return;

        let prefix = null;
        if (field.startsWith('GHG__')) prefix = 'GHG';
        else if (field.startsWith('HAP__')) prefix = 'HAP';
        else if (field.startsWith('PFAS__')) prefix = 'PFAS';
        else if (field.startsWith('PM_Species_Comp__')) prefix = 'PM Species';
        else if (field.startsWith('Other__')) prefix = 'Other';

        if (!prefix) return;

        let prettyName = field;
        const parts = field.split('__');
        if (parts.length > 1) {
          prettyName = parts[1].replace(/_/g, ' ');
        }

        const label = `${prefix}: ${prettyName}`;

        pollutantSums.push({ label, value: v });
      });

      pollutantSums.sort((a, b) => b.value - a.value);
      const top5Pollutants = pollutantSums.slice(0, 5);

      const totalEmissions =
        attrs[COUNTY_FIELDS.TOTAL_EMISSIONS] != null
          ? Number(attrs[COUNTY_FIELDS.TOTAL_EMISSIONS])
          : totalSectorEmissions;

      if (chartInstanceRef.current && chartInstanceRef.current.length) {
        chartInstanceRef.current.forEach((ch) => {
          try { ch.destroy(); } catch (e) {}
        });
      }
      chartInstanceRef.current = [];

      const contentDiv = document.createElement('div');
      contentDiv.style.fontFamily = 'Segoe UI, sans-serif';

      const aqiCategory = countyMaxAQI !== null ? getAQICategory(countyMaxAQI) : null;
      const aqiDisplay = countyMaxAQI !== null ? Math.round(countyMaxAQI) : 'N/A';
      const aqiBgColor = getAQICssColor(aqiCategory);
      const aqiTextColor = aqiCategory && aqiCategory.textColor
        ? aqiCategory.textColor
        : '#000';

      const aqiValueStyle = aqiCategory
        ? `
          background: ${aqiBgColor};
          color: ${aqiTextColor};
          padding: 8px 16px;
          border-radius: 6px;
          display: inline-block;
          font-weight: bold;
          font-size: 18px;
          min-width: 50px;
          text-align: center;
          margin-left: 10px;
        `
        : `
          color: #333;
          font-style: normal;
          font-size: 18px;
          font-weight: 600;
          margin-left: 10px;
        `;

      const monitorStatusMessage =
        res.features.length === 0
          ? '<div style="font-size: 12px; color: #999; margin-top: 5px;">No monitoring stations in this county</div>'
          : validMonitorCount === 0
          ? '<div style="font-size: 12px; color: #999; margin-top: 5px;">All monitors reporting no data</div>'
          : '';

      const concentrationLine =
        countyConcValue != null
          ? `<div><strong>Concentration:</strong> ${countyConcValue} ${countyConcUnit || ''}</div>`
          : '';

      const updatedLine =
        countyUpdateTime
          ? `<div><strong>Data Updated:</strong> ${countyUpdateTime}</div>`
          : '';

      contentDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #333;">
            Current Air Quality
          </div>

          <div style="margin: 10px 0; display: flex; align-items: center;">
            <strong style="color: #817777ff;">Highest AQI:</strong>
            <span style="${aqiValueStyle}">${aqiDisplay}</span>
          </div>

          ${
            aqiCategory
              ? `<div style="font-size: 13px; color: #666; margin: 8px 0; font-weight: 500;">${aqiCategory.label}</div>`
              : ''
          }

          ${monitorStatusMessage}

          <div style="margin: 12px 0; color: #555;">
            <strong>Main Pollutant:</strong> ${countyMainPollutant}
            ${
              countyMainValue !== 'N/A'
                ? ` <span style="color: #000; font-weight: 600;">(AQI: ${countyMainValue})</span>`
                : ''
            }
          </div>

          <div style="margin: 8px 0; color: #555;">
            ${concentrationLine}
            ${updatedLine}
          </div>

          <div style="margin: 12px 0; color: #555;">
            <strong>Total Monitors:</strong> ${res.features.length}
            ${
              validMonitorCount > 0
                ? ` <span style="color: #000; font-weight: 600;">(${validMonitorCount} reporting data)</span>`
                : ''
            }
          </div>
        </div>

        <div style="margin: 15px 0; padding-top: 15px; border-top: 2px solid #e0e0e0;">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #333;">
            2020 Emissions Data (NEI County Summary)
          </div>
          <div style="margin: 4px 0 8px 0; color: #555; font-size: 13px;">
            Uses NEI 2020 county-level CAP (CO, NOₓ, SO₂, PM₂.₅, PM₁₀, VOC, NH₃, Pb),
            plus GHG, HAP, PFAS, PM species, and Other pollutant groups.
          </div>
          <div style="margin: 4px 0 12px 0; color: #555;">
            <strong>Total Emissions (all pollutants & sectors):</strong> ${Number(totalEmissions || 0).toLocaleString()} tons
          </div>

          <div style="font-size: 14px; font-weight: 600; margin: 10px 0 5px 0; color: #333;">
            By Source Sector
          </div>
          <div id="sector-chart-wrapper" style="margin-bottom: 16px;"></div>

          <div style="font-size: 14px; font-weight: 600; margin: 10px 0 5px 0; color: #333;">
            By Criteria Pollutant (Total CAP)
          </div>
          <div id="pollutant-chart-wrapper" style="margin-bottom: 16px;"></div>

          <div style="font-size: 14px; font-weight: 600; margin: 10px 0 5px 0; color: #333;">
            Emission Groups (CAP, GHG, HAP, PFAS, PM Species, Other)
          </div>
          <div id="group-chart-wrapper" style="margin-bottom: 16px;"></div>

          <div style="font-size: 14px; font-weight: 600; margin: 10px 0 5px 0; color: #333;">
            Top 5 Pollutants (by tons)
          </div>
          <div id="top5-chart-wrapper"></div>
        </div>
      `;

      const sectorContainer = contentDiv.querySelector('#sector-chart-wrapper');
      if (sectorContainer) {
        const sectorEntries = [
          { key: 'POINT',    color: '#4c6fff' },
          { key: 'NONPOINT', color: '#ffaf38' },
          { key: 'ONROAD',   color: '#f95d6a' },
          { key: 'NONROAD',  color: '#2ca02c' }
        ].filter(({ key }) => sectorTotals[key] > 0);

        if (sectorEntries.length > 0) {
          const sectorCanvas = document.createElement('canvas');
          sectorCanvas.width = 360;
          sectorCanvas.height = 260;
          sectorContainer.appendChild(sectorCanvas);

          const labels = sectorEntries.map(e => SECTOR_LABELS[e.key]);
          const data = sectorEntries.map(e => sectorTotals[e.key]);
          const colors = sectorEntries.map(e => e.color);

          const total = totalSectorEmissions || data.reduce((a, b) => a + b, 0);

          const sectorChart = new Chart(sectorCanvas, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 10,
                    font: { size: 11 }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                      return `${label}: ${value.toLocaleString()} tons (${pct}%)`;
                    }
                  }
                }
              },
              cutout: '55%'
            }
          });
          chartInstanceRef.current.push(sectorChart);
        } else {
          sectorContainer.innerHTML =
            '<div style="font-size: 12px; color: #777;">No sector-resolved emissions data available for CAP pollutants.</div>';
        }
      }

      const pollutantContainer = contentDiv.querySelector('#pollutant-chart-wrapper');
      if (pollutantContainer) {
        const pollutantEntries = [
          { key: 'CO',   color: '#1f77b4' },
          { key: 'NOX',  color: '#ff7f0e' },
          { key: 'SO2',  color: '#2ca02c' },
          { key: 'PM25', color: '#d62728' },
          { key: 'PM10', color: '#9467bd' },
          { key: 'VOC',  color: '#8c564b' },
          { key: 'NH3',  color: '#17becf' },
          { key: 'PB',   color: '#bcbd22' }
        ].filter(({ key }) => pollutantTotals[key] > 0);

        const totalPoll = totalPollEmissions || pollutantEntries
          .reduce((sum, e) => sum + pollutantTotals[e.key], 0);

        if (pollutantEntries.length > 0 && totalPoll > 0) {
          const pollutantCanvas = document.createElement('canvas');
          pollutantCanvas.width = 360;
          pollutantCanvas.height = 260;
          pollutantContainer.appendChild(pollutantCanvas);

          const labels = pollutantEntries.map(e => POLLUTANT_LABELS[e.key]);
          const data = pollutantEntries.map(e => pollutantTotals[e.key]);
          const colors = pollutantEntries.map(e => e.color);

          const pollutantChart = new Chart(pollutantCanvas, {
            type: 'doughnut',
            data: {
              labels,
              datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 10,
                    font: { size: 11 }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const pct = totalPoll > 0 ? ((value / totalPoll) * 100).toFixed(1) : '0.0';
                      return `${label}: ${value.toLocaleString()} tons (${pct}%)`;
                    }
                  }
                }
              },
              cutout: '55%'
            }
          });
          chartInstanceRef.current.push(pollutantChart);
        } else {
          pollutantContainer.innerHTML =
            '<div style="font-size: 12px; color: #777;">No criteria pollutant totals available for this county.</div>';
        }
      }

      const groupContainer = contentDiv.querySelector('#group-chart-wrapper');
      if (groupContainer) {
        const groupEntries = [
          { key: 'CAP',        color: '#4c6fff' },
          { key: 'GHG',        color: '#00b894' },
          { key: 'HAP',        color: '#e17055' },
          { key: 'PFAS',       color: '#6c5ce7' },
          { key: 'PM_SPECIES', color: '#fdcb6e' },
          { key: 'OTHER',      color: '#636e72' }
        ].filter(({ key }) => groupTotals[key] > 0);

        if (groupEntries.length > 0) {
          const groupCanvas = document.createElement('canvas');
          groupCanvas.width = 380;
          groupCanvas.height = 260;
          groupContainer.appendChild(groupCanvas);

          const labels = groupEntries.map(e => GROUP_LABELS[e.key]);
          const data = groupEntries.map(e => groupTotals[e.key]);
          const colors = groupEntries.map(e => e.color);

          const groupChart = new Chart(groupCanvas, {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.parsed.y || 0;
                      return `${value.toLocaleString()} tons`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  ticks: {
                    maxRotation: 45,
                    minRotation: 20,
                    font: { size: 10 }
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Tons'
                  },
                  beginAtZero: true
                }
              }
            }
          });
          chartInstanceRef.current.push(groupChart);
        } else {
          groupContainer.innerHTML =
            '<div style="font-size: 12px; color: #777;">No group-wise emissions totals available.</div>';
        }
      }

      const top5Container = contentDiv.querySelector('#top5-chart-wrapper');
      if (top5Container) {
        if (top5Pollutants.length > 0) {
          const top5Canvas = document.createElement('canvas');
          top5Canvas.width = 380;
          top5Canvas.height = 260;
          top5Container.appendChild(top5Canvas);

          const labels = top5Pollutants.map(p => p.label);
          const data = top5Pollutants.map(p => p.value);

          const top5Chart = new Chart(top5Canvas, {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                data,
                backgroundColor: '#0984e3',
                borderWidth: 1,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.parsed.y || 0;
                      return `${value.toLocaleString()} tons`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  ticks: {
                    maxRotation: 45,
                    minRotation: 25,
                    font: { size: 9 }
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Tons'
                  },
                  beginAtZero: true
                }
              }
            }
          });
          chartInstanceRef.current.push(top5Chart);
        } else {
          top5Container.innerHTML =
            '<div style="font-size: 12px; color: #777;">No pollutant-specific totals available for this county.</div>';
        }
      }

      isStationPopupRef.current = false;

      view.popup.open({
        title: `${attrs.County}, ${attrs.State}`,
        content: contentDiv,
        location: graphic.geometry.centroid
      });
    }).catch(error => {
      console.error('Error querying monitors:', error);
    });
  };

useEffect(() => {
    esriConfig.apiKey = "";
    //esriConfig.request.useIdentity = false;

    const map = new Map({ basemap: 'osm' });

    const view = new MapView({
      container: mapDiv.current,
      map,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      constraints: MAP_CONFIG.constraints,
      highlightOptions: {
        color: [255, 255, 0, 1],
        haloOpacity: 0.9,
        fillOpacity: 0.2
      }
    });

    viewRef.current = view;

    view.popup.autoOpenEnabled = false;
    view.popup.dockEnabled = false;
    view.popup.dockOptions = {
      position: 'bottom-center',
      breakpoint: false,
      buttonEnabled: true
    };

    const clusterConfig = {
      type: 'cluster',
      clusterRadius: '80px',
      clusterMinSize: '22px',
      clusterMaxSize: '30px',
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        color: [0, 200, 0, 1],
        size: 24,
        outline: {
          color: [255, 255, 255, 1],
          width: 3
        }
      },
      labelingInfo: [{
        deconflictionStrategy: 'none',
        labelExpressionInfo: {
          expression: "Text($feature.cluster_count, '#,###')"
        },
        symbol: {
          type: 'text',
          color: 'white',
          font: {
            weight: 'bold',
            family: 'Noto Sans',
            size: '12px'
          }
        },
        labelPlacement: 'center-center'
      }],
      popupTemplate: {
        title: 'Cluster of {cluster_count} monitors',
        content: 'Zoom in to see individual monitoring stations'
      }
    };
    const CLUSTER_OFF_ZOOM = 10;

    const emissionsLayer = new FeatureLayer({
      url: LAYERS.COUNTY_EMISSIONS.url,
      title: LAYERS.COUNTY_EMISSIONS.title,
      opacity: LAYERS.COUNTY_EMISSIONS.opacity,
      outFields: LAYERS.COUNTY_EMISSIONS.outFields,
      popupEnabled: false,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [102, 126, 234, 0.25],
          outline: { color: [160, 160, 160, 1], width: 1 }
        }
      }
    });

    const monitorsLayer = new FeatureLayer({
      url: LAYERS.AIRNOW_MONITORS.url,
      title: LAYERS.AIRNOW_MONITORS.title,
      outFields: ['*'],
      refreshInterval: LAYERS.AIRNOW_MONITORS.refreshInterval,
      definitionExpression: '1=1',
      renderer: {
        type: 'class-breaks',
        valueExpression: `
          var ozoneSort = $feature.OZONE_AQI_SORT;
          var pm25Sort = $feature.PM25_AQI_SORT;
          var pm10Sort = $feature.PM10_AQI_SORT;
          
          var validValues = [];
          if (ozoneSort != null && ozoneSort != -999 && ozoneSort > 0) {
            validValues[Count(validValues)] = ozoneSort;
          }
          if (pm25Sort != null && pm25Sort != -999 && pm25Sort > 0) {
            validValues[Count(validValues)] = pm25Sort;
          }
          if (pm10Sort != null && pm10Sort != -999 && pm10Sort > 0) {
            validValues[Count(validValues)] = pm10Sort;
          }
          if (Count(validValues) == 0) { return 0; }
          var max = validValues[0];
          for (var i = 1; i < Count(validValues); i++) {
            if (validValues[i] > max) { max = validValues[i]; }
          }
          return max;
        `,
        classBreakInfos: AQI_CATEGORIES.map(cat => ({
          minValue: cat.min,
          maxValue: cat.max,
          symbol: {
            type: 'simple-marker',
            size: 14,
            color: cat.color,
            outline: { color: [255, 255, 255], width: 2.5 }
          },
          label: cat.label
        })),
        defaultSymbol: {
          type: 'simple-marker',
          size: 12,
          color: [128, 128, 128, 0.8],
          outline: { color: [255, 255, 255], width: 2 }
        }
      },
      featureReduction: clusterConfig
    });

    monitorsLayerRef.current = monitorsLayer;
    emissionsLayerRef.current = emissionsLayer;

    map.addMany([emissionsLayer, monitorsLayer]);

    view.watch('zoom', (zoom) => {
      if (!monitorsLayer) return;
      if (zoom >= CLUSTER_OFF_ZOOM) {
        monitorsLayer.featureReduction = null;
      } else {
        monitorsLayer.featureReduction = clusterConfig;
      }
    });

    const homeWidget = new Home({ view });
    view.ui.add(homeWidget, 'top-left');

    const scaleBar = new ScaleBar({ view, unit: 'dual' });
    view.ui.add(scaleBar, 'bottom-left');

    const legend = new Legend({ view, style: 'card' });
    const legendExpand = new Expand({
      view,
      content: legend,
      expanded: false,
      expandIconClass: 'esri-icon-layer-list'
    });
    view.ui.add(legendExpand, 'bottom-right');

    const updateStatistics = () => {
      Promise.all([
        monitorsLayer.queryFeatureCount({ where: '1=1' }),
        monitorsLayer.queryFeatures({
          where: '1=1',
          outFields: [
            MONITOR_FIELDS.OZONE_SORT,
            MONITOR_FIELDS.OZONE_LABEL,
            MONITOR_FIELDS.PM25_SORT,
            MONITOR_FIELDS.PM25_LABEL,
            MONITOR_FIELDS.PM10_SORT,
            MONITOR_FIELDS.PM10_LABEL
          ],
          returnGeometry: false,
          num: 2000
        })
      ]).then(([count, result]) => {
        let totalAQI = 0;
        let validCount = 0;

        result.features.forEach(feature => {
          const monitorData = getMaxAQIFromAttrs(feature.attributes);
          if (monitorData && monitorData.maxAQI > 0) {
            totalAQI += monitorData.maxAQI;
            validCount++;
          }
        });

        const avgAQI = validCount > 0 ? Math.round(totalAQI / validCount) : 0;

        setStatistics(prev => ({
          ...prev,
          totalMonitors: count,
          avgAQI,
          lastUpdated: new Date().toLocaleString()
        }));
      }).catch(error => {
        console.error('Error updating statistics:', error);
      });
    };

    let statsInterval = null;

    view.when(() => {
      setIsLoading(false);
      updateStatistics();
      statsInterval = setInterval(updateStatistics, 300000);
    });

    view.on('pointer-move', (event) => {
      const monitorsLayerLocal = monitorsLayerRef.current;
      if (!monitorsLayerLocal) return;

      view.hitTest(event).then((response) => {
        const stationHit = response.results.find(
          r => r.graphic.layer === monitorsLayerLocal && !r.graphic.isAggregate
        );

        if (stationHit) {
          const graphic = stationHit.graphic;
          const oidField = monitorsLayerLocal.objectIdField;
          const oid = oidField ? graphic.attributes[oidField] : null;

          if (oid != null && lastHoverStationIdRef.current === oid) {
            return;
          }

          lastHoverStationIdRef.current = oid;
          isStationPopupRef.current = true;

          view.popup.open({
            features: [graphic],
            location: event.mapPoint,
            updateLocationEnabled: true
          });
        } else {
          if (isStationPopupRef.current) {
            isStationPopupRef.current = false;
            lastHoverStationIdRef.current = null;
            view.popup.close();
          }
        }
      }).catch(() => {});
    });

    view.on('click', (event) => {
      view.hitTest(event).then((response) => {
        const monitorsLayerLocal = monitorsLayerRef.current;
        const emissionsLayerLocal = emissionsLayerRef.current;

        if (!monitorsLayerLocal || !emissionsLayerLocal) return;

        const monitorResult = response.results.find(
          r => r.graphic.layer === monitorsLayerLocal && !r.graphic.isAggregate
        );
        if (monitorResult) {
          return;
        }

        const countyResult = response.results.find(
          r => r.graphic.layer === emissionsLayerLocal
        );
        
        if (countyResult) {
          const graphic = countyResult.graphic;
          view.goTo(graphic, { 
            duration: 800,
            easing: 'ease-in-out'
          });

          displayCountyPopup(graphic);
        }
      });
    });

    return () => {
      if (statsInterval) {
        clearInterval(statsInterval);
      }
      if (chartInstanceRef.current && chartInstanceRef.current.length) {
        chartInstanceRef.current.forEach((ch) => {
          try { ch.destroy(); } catch (e) {}
        });
      }
      if (view) {
        view.destroy();
      }
    };
  }, []);

  const toggleLayer = (layerName) => {
    const newVisibility = !layerVisibility[layerName];
    setLayerVisibility(prev => ({ ...prev, [layerName]: newVisibility }));
    
    if (layerName === 'emissions' && emissionsLayerRef.current) {
      emissionsLayerRef.current.visible = newVisibility;
    } else if (layerName === 'monitors' && monitorsLayerRef.current) {
      monitorsLayerRef.current.visible = newVisibility;
    }
  };

  const changeBasemap = (basemapId) => {
    const view = viewRef.current;
    if (view && view.map) {
      view.map.basemap = basemapId;
      setCurrentBasemap(basemapId);
    }
  };

  return (
    <div className="map-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading Air Quality Data...</div>
        </div>
      )}

      <div className="app-header">
        <div>
          <h1>🌍 County Air Quality Explorer</h1>
          <p>Real-time AQI monitoring and 2020 emissions data across U.S. counties</p>
        </div>
        <div className="header-info">
          <div className="data-refresh">
            📡 Data updates every hour
          </div>
        </div>
      </div>

      <div className="search-bar-container">
        <SearchBar 
          onSearchResult={displayCountyPopup}
          emissionsLayer={emissionsLayerRef.current}
          view={viewRef.current}
        />
      </div>

      <div ref={mapDiv} className="mapDiv"></div>

      {!isLoading && (
        <>
          <button 
            className="panel-toggle-btn toggle-controls"
            onClick={() => setShowControls(!showControls)}
            title="Toggle Controls"
            aria-label="Toggle Controls Panel"
          >
            ☰
          </button>

          {showControls && (
            <div className="control-panel">
              <h3>🎛️ Map Controls</h3>
              
              <div className="control-section">
                <div className="control-section-title">🗺️ Basemap Style</div>
                
                <select 
                  className="basemap-dropdown"
                  value={currentBasemap}
                  onChange={(e) => changeBasemap(e.target.value)}
                >
                  <option value="osm">OpenStreetMap</option>
                  <option value="streets-vector">Streets (requires API key)</option>
                  <option value="topo-vector">Topographic (requires API key)</option>
                  <option value="satellite">Satellite (requires API key)</option>
                  <option value="hybrid">Hybrid (requires API key)</option>
                  <option value="gray-vector">Gray Canvas (requires API key)</option>
                  <option value="dark-gray-vector">Dark Gray Canvas (requires API key)</option>
                  <option value="oceans">Oceans (requires API key)</option>
                </select>
              </div>

              <div className="control-section">
                <div className="control-section-title">📊 Data Layers</div>
                
                <div className="layer-toggle">
                  <input 
                    type="checkbox" 
                    id="emissions-toggle"
                    checked={layerVisibility.emissions}
                    onChange={() => toggleLayer('emissions')}
                  />
                  <label htmlFor="emissions-toggle">
                    2020 County Emissions (NEI)
                  </label>
                </div>

                <div className="layer-toggle">
                  <input 
                    type="checkbox" 
                    id="monitors-toggle"
                    checked={layerVisibility.monitors}
                    onChange={() => toggleLayer('monitors')}
                  />
                  <label htmlFor="monitors-toggle">
                    Real-Time Air Quality Monitors
                  </label>
                </div>
              </div>

              <div className="control-section">
                <div className="control-section-title">AQI Scale</div>
                <div className="aqi-legend">
                  {AQI_CATEGORIES.map(cat => (
                    <div key={cat.label} className="aqi-legend-item">
                      <div 
                        className="aqi-color-box" 
                        style={{ backgroundColor: `rgba(${cat.color.join(',')})` }}
                      ></div>
                      <span className="aqi-label">{cat.label}</span>
                      <span className="aqi-range">({cat.min}-{cat.max})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button 
            className="panel-toggle-btn toggle-instructions"
            onClick={() => setShowInstructions(!showInstructions)}
            title="Toggle Instructions"
            aria-label="Toggle Instructions Panel"
          >
            ℹ️
          </button>

          {showInstructions && (
            <div className="instructions-panel">
              <h3>📖 How to Use</h3>
              
              <div className="instruction-item">
                <div className="instruction-icon">1</div>
                <div className="instruction-text">
                  <strong>Search counties</strong> using the search bar at the top
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">2</div>
                <div className="instruction-text">
                  <strong>Click any county</strong> to view detailed air quality data and emissions
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">3</div>
                <div className="instruction-text">
                  <strong>Hover over monitors</strong> to view detailed station information
                </div>
              </div>

              <div className="instruction-item">
                <div className="instruction-icon">4</div>
                <div className="instruction-text">
                  <strong>Zoom at any level</strong> — clustering adapts automatically
                </div>
              </div>
            </div>
          )}

          <div className="statistics-panel">
            <h4>📊 Current Statistics</h4>
            <div className="stat-item">
              <span className="stat-label">Active Monitors:</span>
              <span className="stat-value">{statistics.totalMonitors.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average AQI:</span>
              <span className="stat-value">{statistics.avgAQI}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Data Source:</span>
              <span className="stat-value">EPA AirNow</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Updated:</span>
              <span className="stat-value">
                {statistics.lastUpdated || '—'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MapViewComponent;
import { subwayStations } from './subway-stations.js';
import { fetchTrainData, getTrainData, formatTime, getTimeUntil } from './train-data.js';

document.addEventListener('DOMContentLoaded', () => {
    // Table tabs (Northbound / Southbound)
    const northboundTab = document.getElementById('northbound-tab');
    const southboundTab = document.getElementById('southbound-tab');
    const northboundTimetable = document.getElementById('northbound-timetable');
    const southboundTimetable = document.getElementById('southbound-timetable');
        
    northboundTab.addEventListener('click', () => {
        northboundTab.classList.add('active');
        southboundTab.classList.remove('active');
        northboundTimetable.classList.add('active');
        southboundTimetable.classList.remove('active');
    });
    
    southboundTab.addEventListener('click', () => {
        southboundTab.classList.add('active');
        northboundTab.classList.remove('active');
        southboundTimetable.classList.add('active');
        northboundTimetable.classList.remove('active');
    });

    // Station container elements
    const northboundStationsContainer = document.getElementById('northbound-stations');
    const southboundStationsContainer = document.getElementById('southbound-stations');
    
    // Populate timetables with subway stations
    const fTrainStations = Object.keys(subwayStations);
    const northboundStations = [...fTrainStations].reverse();
    populateStationTable(northboundStations, northboundStationsContainer);
    populateStationTable(fTrainStations, southboundStationsContainer);
    
    // Initialize train data and set up auto-refresh every 30 seconds
    refreshTrainData();
    setInterval(refreshTrainData, 30000);
});

/**
 * Refreshes the train data and updates the UI
 */
async function refreshTrainData() {
    document.getElementById('data-source').textContent = 'Fetching data...';
    
    await fetchTrainData();
    updateTimetables();
    const trainData = getTrainData();
    document.getElementById('data-source').textContent = trainData.dataSource;
    
    if (trainData.lastUpdated) {
        document.getElementById('last-updated').textContent = trainData.lastUpdated.toLocaleString();
    }
}

/**
 * Updates the timetables with the latest train data
 */
function updateTimetables() {
    const trainData = getTrainData();
    
    // Update northbound timetable
    updateStationRows(
        document.getElementById('northbound-stations'),
        trainData.northbound
    );
    
    // Update southbound timetable
    updateStationRows(
        document.getElementById('southbound-stations'),
        trainData.southbound
    );
}

/**
 * Updates the rows in a timetable with train arrival data
 * @param {HTMLElement} container - The table body element
 * @param {Object} stationData - Train data for each station
 */
function updateStationRows(container, stationData) {
    if (!container) return;
    
    const rows = container.querySelectorAll('tr');
    
    rows.forEach(row => {
        // Skip borough header rows
        if (row.classList.contains('borough-header')) {
            return; 
        }
        
        const stationCell = row.querySelector('.station-name');
        if (!stationCell) return;
        
        const stationName = stationCell.textContent;
        const trainsCell = row.querySelector('.train-times');
        if (!trainsCell) return;
        trainsCell.innerHTML = '';
        
        const arrivals = stationData[stationName] || [];
        
        if (arrivals.length === 0) {
            // No upcoming trains
            const noTrainsSpan = document.createElement('span');
            noTrainsSpan.textContent = 'No upcoming trains';
            noTrainsSpan.classList.add('no-trains');
            trainsCell.appendChild(noTrainsSpan);
        } else {
            // Filter for next 3 trains
            arrivals.slice(0, 3).forEach(train => {
                const timeSpan = document.createElement('span');
                timeSpan.classList.add('train-time');
                
                // Format time display
                const clockTime = formatTime(train.arrivalTime);
                const minutesUntil = getTimeUntil(train.arrivalTime);
                timeSpan.textContent = `${clockTime} (${minutesUntil})`;
                
                trainsCell.appendChild(timeSpan);
            });
        }
    });
}

/**
 * Populates a timetable with station rows
 * @param {Array} stations - Array of station names
 * @param {HTMLElement} container - The tbody element to populate
 */
function populateStationTable(stations, container) {
    container.innerHTML = '';
    const isNorthbound = stations[0] === 'Coney Island-Stillwell Av';
    const boroughOrder = isNorthbound ? 
        ['Brooklyn', 'Manhattan', 'Queens'] : 
        ['Queens', 'Manhattan', 'Brooklyn'];

    boroughOrder.forEach(borough => {
        addBoroughHeader(borough, container);
        addStationsInBorough(borough, stations, container);
    });
}

/**
 * Adds a borough header to the table
 * @param {string} boroughName - Name of the borough
 * @param {HTMLElement} container - The tbody element to add to
 */
function addBoroughHeader(boroughName, container) {
    const boroughRow = document.createElement('tr');
    boroughRow.classList.add('borough-header');
    
    const boroughCell = document.createElement('td');
    boroughCell.textContent = boroughName;
    boroughCell.colSpan = 2;
    boroughRow.appendChild(boroughCell);
    
    container.appendChild(boroughRow);
}

/**
 * Adds stations from a specific borough to the table
 * @param {string} boroughName - Name of the borough
 * @param {Array} stations - Array of all station names
 * @param {HTMLElement} container - The tbody element to add to
 */
function addStationsInBorough(boroughName, stations, container) {
    const boroughStations = {
        'Queens': [
            'Jamaica-179 St', '169 St', 'Parsons Blvd', 'Sutphin Blvd', 'Briarwood', 
            'Kew Gardens-Union Tpke', '75 Av', 'Forest Hills-71 Av', '67 Av', 
            '63 Dr-Rego Park', 'Woodhaven Blvd', 'Grand Av-Newtown', 'Elmhurst Av', 
            'Jackson Hts-Roosevelt Av', '65 St', 'Northern Blvd', '46 St', 'Steinway St', 
            '36 St', '21 St-Queensbridge'
        ],
        'Manhattan': [
            'Roosevelt Island', 'Lexington Av/63 St', '57 St', '47-50 Sts-Rockefeller Ctr', 
            '42 St-Bryant Pk', '34 St-Herald Sq', '23 St', '14 St', 'W 4 St-Wash Sq', 
            'Broadway-Lafayette St', '2 Av', 'Delancey St-Essex St', 'East Broadway'
        ],
        'Brooklyn': [
            'York St', 'Jay St-MetroTech', 'Bergen St', 'Carroll St', 'Smith-9 Sts', 
            '4 Av-9 St', '7 Av', '15 St-Prospect Park', 'Fort Hamilton Pkwy', 'Church Av', 
            'Ditmas Av', '18 Av', 'Avenue I', 'Bay Pkwy', 'Avenue N', 'Avenue P', 'Kings Hwy', 
            'Avenue U', 'Avenue X', 'Neptune Av', 'W 8 St-NY Aquarium', 'Coney Island-Stillwell Av'
        ]
    };
    
    const stationsInBorough = stations.filter(station => 
        boroughStations[boroughName].includes(station)
    );
    
    // Add each station row
    stationsInBorough.forEach(station => {
        const row = document.createElement('tr');
        
        // Station name column
        const stationCell = document.createElement('td');
        stationCell.textContent = station;
        stationCell.classList.add('station-name');
        row.appendChild(stationCell);
        
        // Next trains column 
        const trainsCell = document.createElement('td');
        trainsCell.classList.add('train-times');
        
        // Create loading placeholder
        const loadingSpan = document.createElement('span');
        loadingSpan.textContent = 'Loading...';
        loadingSpan.classList.add('loading');
        trainsCell.appendChild(loadingSpan);
        
        row.appendChild(trainsCell);
        container.appendChild(row);
    });
} 
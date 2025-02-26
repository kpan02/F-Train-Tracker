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
    
    // Refresh button
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Data';
    refreshButton.id = 'refresh-button';
    refreshButton.addEventListener('click', refreshTrainData);
    document.querySelector('.timetable-controls').appendChild(refreshButton);
    
    // Auto-refresh website every 60 seconds
    refreshTrainData();
    setInterval(refreshTrainData, 60000);
});

/**
 * Refreshes the train data and updates the UI
 */
async function refreshTrainData() {
    document.getElementById('refresh-button').classList.add('refreshing');
    document.getElementById('data-source').textContent = 'Fetching data...';
    
    await fetchTrainData();
    updateTimetables();
    const trainData = getTrainData();
    document.getElementById('data-source').textContent = trainData.dataSource;
    
    if (trainData.lastUpdated) {
        document.getElementById('last-updated').textContent = trainData.lastUpdated.toLocaleString();
    }
    document.getElementById('refresh-button').classList.remove('refreshing');
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
    
    stations.forEach(station => {
        const row = document.createElement('tr');
        
        // Station name cell
        const stationCell = document.createElement('td');
        stationCell.textContent = station;
        stationCell.classList.add('station-name');
        row.appendChild(stationCell);
        
        // Next trains cell - will contain multiple train times
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
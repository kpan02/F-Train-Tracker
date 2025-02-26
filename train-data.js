import { subwayStations } from './subway-stations.js';

// MTA API configuration
const MTA_API_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm";
const PROTO_URL = "https://raw.githubusercontent.com/google/transit/master/gtfs-realtime/proto/gtfs-realtime.proto";

// Map: {stopId: stationName}
const stopIdToStation = {};
Object.entries(subwayStations).forEach(([stationName, stopIds]) => {
    stopIds.forEach(stopId => {
        stopIdToStation[stopId] = stationName;
        stopIdToStation[`${stopId}N`] = stationName; // Northbound ID
        stopIdToStation[`${stopId}S`] = stationName; // Southbound ID
    });
});

// Store processed train data
let trainData = {
    northbound: {}, // Station name -> array of arrival times
    southbound: {}, // Station name -> array of arrival times
    lastUpdated: null,
    dataSource: "Loading..."
};

/**
 * Main function to fetch F train data
 */
export async function fetchTrainData() {
    try {
        const data = await fetchDirectFromMTA();
        if (data) {
            trainData.dataSource = "MTA API (direct)";
            processTrainData(data);
            return true;
        }
        throw new Error("Failed to fetch train data from MTA API");

    } catch (error) {
        console.error("Failed to fetch train data:", error);
        trainData.dataSource = "Error fetching data";
        return false;
    }
}

/**
 * Retrieve real-time train data from the MTA API, filter for F trains
 */
async function fetchDirectFromMTA() {
    try {
        // Protocol Buffer definition
        const protoResponse = await fetch(PROTO_URL);
        if (!protoResponse.ok) {
            throw new Error(`Failed to fetch proto file: ${protoResponse.status}`);
        }
        const protoContent = await protoResponse.text();
        const root = protobuf.parse(protoContent).root;
        
        // MTA API response
        const response = await fetch(MTA_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const feedMessage = root.lookupType("transit_realtime.FeedMessage");
        const feed = feedMessage.decode(new Uint8Array(buffer));
        
        // Filter for F train data
        const fTrainEntities = feed.entity.filter(entity => {
            if (entity.tripUpdate && entity.tripUpdate.trip) {
                return entity.tripUpdate.trip.routeId === "F";
            }
            return false;
        });
        
        return {
            entities: fTrainEntities,
            timestamp: Date.now()
        };
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}


/**
 * Process & organize raw train data
 */
function processTrainData(rawData) {
    trainData = {
        northbound: {},
        southbound: {},
        lastUpdated: new Date(),
        dataSource: trainData.dataSource
    };
    
    Object.keys(subwayStations).forEach(station => {
        trainData.northbound[station] = [];
        trainData.southbound[station] = [];
    });
    
    // Process each train entity in the data
    rawData.entities.forEach(entity => {
        if (!entity.tripUpdate || !entity.tripUpdate.stopTimeUpdate) return;
        
        const tripId = entity.tripUpdate.trip.tripId;
        // Determine direction based on trip ID (N for northbound, S for southbound)
        const isNorthbound = tripId.includes('..N') || tripId.includes('_N_');
        let direction;
        if (isNorthbound) {
            direction = 'northbound';
        } else {
            direction = 'southbound';
        }
        
        // Process each upcoming stop for this train
        entity.tripUpdate.stopTimeUpdate.forEach(stop => {
            const stopId = stop.stopId;
            const stationName = stopIdToStation[stopId];
            
            if (!stationName) return; 
            
            // Get arrival time
            if (stop.arrival && stop.arrival.time) {
                const arrivalTime = new Date(stop.arrival.time * 1000);
                const now = new Date();
                const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
                
                // Filter for future arrivals within the next 2 hours
                if (arrivalTime > now && arrivalTime < twoHoursFromNow) {
                    trainData[direction][stationName].push({
                        tripId,
                        arrivalTime
                    });
                }
            }
        });
    });
    
    // Sort arrival times for each station
    Object.keys(trainData.northbound).forEach(station => {
        trainData.northbound[station].sort((a, b) => a.arrivalTime - b.arrivalTime);
        trainData.southbound[station].sort((a, b) => a.arrivalTime - b.arrivalTime);
    });
}

/**
 * Gets the processed train data
 */
export function getTrainData() {
    return trainData;
}

/**
 * Formats a Date object into a user-friendly time string
 */
export function formatTime(date) {
    if (!date) return '--';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Calculates and formats the time until arrival
 */
export function getTimeUntil(arrivalTime) {
    if (!arrivalTime) return '';
    
    const now = new Date();
    const diffMs = arrivalTime - now;
    const diffMin = Math.round(diffMs / 60000); 
    
    if (diffMin <= 0) return 'Now';
    if (diffMin === 1) return '1 min';
    if (diffMin < 60) return `${diffMin} min`;
    
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}h ${mins}m`;
} 
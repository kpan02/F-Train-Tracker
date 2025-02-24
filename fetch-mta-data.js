const fetch = require("node-fetch");
const protobuf = require("protobufjs");

const MTA_API_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm";
const PROTO_URL = "https://raw.githubusercontent.com/google/transit/master/gtfs-realtime/proto/gtfs-realtime.proto";

async function fetchSubwayData() {
    try {
        // Get the GTFS-realtime proto file
        const protoResponse = await fetch(PROTO_URL);
        if (!protoResponse.ok) {
            throw new Error(`Failed to fetch proto file: ${protoResponse.status}`);
        }
        const protoContent = await protoResponse.text();
        const root = await protobuf.parse(protoContent).root;
        
        // Fetch the MTA data
        const response = await fetch(MTA_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const feedMessage = root.lookupType("transit_realtime.FeedMessage");
        const feed = feedMessage.decode(new Uint8Array(buffer));

        // Filter for F train entities only
        const fTrainEntities = feed.entity.filter(entity => {
            if (entity.tripUpdate && entity.tripUpdate.trip) {
                return entity.tripUpdate.trip.routeId === "F";
            }
            if (entity.vehicle && entity.vehicle.trip) {
                return entity.vehicle.trip.routeId === "F";
            }
            return false;
        });

        // More detailed logging
        fTrainEntities.forEach(entity => {
            if (entity.tripUpdate) {
                console.log(`F Train ID: ${entity.tripUpdate.trip.tripId}`);
                console.log('Upcoming stops:');
                entity.tripUpdate.stopTimeUpdate.forEach(stop => {
                    console.log(`  Stop ID: ${stop.stopId}`);
                    if (stop.arrival) {
                        console.log(`    Arrival time: ${new Date(stop.arrival.time * 1000).toLocaleTimeString()}`);
                    }
                });
                console.log('---');
            }
        });

    } catch(error) {
        console.error("Error fetching subway data:", error);
    }
}

fetchSubwayData();

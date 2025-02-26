# NYC F Train Tracker

A real-time tracker for the F train in New York City's subway system. This application displays arrival times for all stations along the F train route in both northbound and southbound directions.

## Features

- Real-time F train arrival data from the MTA API
- Separate timetables for northbound and southbound trains
- Displays both clock time and minutes until arrival
- Auto-refreshes every 60 seconds
- Mobile-responsive design
- Multiple data fetching methods with fallbacks

## How It Works

This application fetches real-time data from the MTA's GTFS-realtime feed, which provides information about train arrivals, delays, and service changes. The data is in Protocol Buffer format, which we decode in the browser using the protobufjs library.

### Data Fetching Strategy

The application uses a multi-tiered approach to fetch data:

1. **Direct API Access**: First attempts to fetch directly from the MTA API
2. **CORS Proxy**: If direct access fails (due to CORS restrictions), tries using a CORS proxy
3. **Mock Data**: As a last resort, generates realistic mock data to ensure the application always works

## Viewing the Application

You can view the live application at: https://[your-github-username].github.io/cs5356-hw3/

## Local Development

To run this application locally:

1. Clone the repository:
   ```
   git clone https://github.com/[your-github-username]/cs5356-hw3.git
   cd cs5356-hw3
   ```

2. Start a local server:
   ```
   # Using Python 3
   python -m http.server
   
   # Using Python 2
   python -m SimpleHTTPServer
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Deployment to GitHub Pages

This application is designed to work on GitHub Pages without any server-side code:

1. Push your code to GitHub:
   ```
   git add .
   git commit -m "Add F train tracker"
   git push origin main
   ```

2. Enable GitHub Pages in your repository settings:
   - Go to your repository on GitHub
   - Click on "Settings"
   - Scroll down to the "GitHub Pages" section
   - Under "Source", select the branch you want to deploy (usually "main")
   - Click "Save"

3. Your site will be published at:
   ```
   https://[your-github-username].github.io/cs5356-hw3/
   ```

## Technical Details

### Libraries Used

- **protobufjs**: For decoding the Protocol Buffer format used by the MTA API
- No other external libraries - just vanilla JavaScript, HTML, and CSS

### Browser Compatibility

This application works in all modern browsers (Chrome, Firefox, Safari, Edge).

### Challenges and Solutions

- **CORS Restrictions**: The MTA API may have CORS restrictions that prevent direct browser access. We handle this with a fallback to a CORS proxy.
- **Protocol Buffer Format**: The MTA data is in Protocol Buffer format, not JSON. We use the protobufjs library to decode it in the browser.
- **API Reliability**: To ensure the application always works, we include a mock data generator as a final fallback.

## License

ISC

## Acknowledgments

- MTA for providing the real-time API
- Google for the GTFS-realtime protocol
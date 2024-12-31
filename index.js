import express from 'express';
import cors from 'cors';
import { Client } from '@googlemaps/google-maps-services-js';
import { GOOGLE_MAPS_API_KEY } from './config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const mapsClient = new Client({});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/places', async (req, res) => {
    try {
        const { location, type, radius = 1000 } = req.query;

        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }

        const geocodeResponse = await mapsClient.geocode({
            params: {
                address: location,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (!geocodeResponse.data.results?.[0]) {
            return res.status(404).json({ error: 'Location not found' });
        }

        const location_coords = geocodeResponse.data.results[0].geometry.location;

        const placeResponse = await mapsClient.placesNearby({
            params: {
                location: location_coords,
                radius: parseInt(radius),
                type: type || undefined,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        console.log(`Found ${placeResponse.data.results?.length || 0} places`);
        res.json(placeResponse.data);
    } catch (error) {
        console.error('Places API Error:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.error_message || error.message });
    }
});

app.get('/directions', async (req, res) => {
    try {
        const { origin, destination, mode = 'driving' } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }

        const response = await mapsClient.directions({
            params: {
                origin,
                destination,
                mode: mode.toLowerCase(),
                key: GOOGLE_MAPS_API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Directions API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
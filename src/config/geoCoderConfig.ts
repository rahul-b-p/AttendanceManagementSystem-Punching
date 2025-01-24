import NodeGeocoder from 'node-geocoder';import { GEOCODING_API_KEY } from './envConfig';

// Configuring node-geocoder

const options: NodeGeocoder.Options = {
    provider: 'opencage',
    apiKey: GEOCODING_API_KEY,
    formatter: null
};

const geocoder = NodeGeocoder(options);

export default geocoder;
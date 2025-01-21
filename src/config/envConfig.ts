import { config } from 'dotenv';
config();

const requiredEnvVariables = [
    'PORT',
    'MONGODB_URI',
    'HASH_SALT_ROUNDS',
    'HASH_ALGORITHM',
    'ADMIN_EMAIL',
    'ADMIN_PHONE',
    'ADMIN_PASSWORD',
    'ACCESS_TOKEN_SECRET',
    'ACCESS_TOKEN_EXPIRATION',
    'REFRESH_TOKEN_SECRET',
    'REFRESH_TOKEN_EXPIRATION',
    'HOST_EMAIL_ID',
    'HOST_EMAIL_PASSKEY',
    'GEOCODING_API_KEY',
    'MIN_THRESHOLD'
];

requiredEnvVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}. Please ensure it is defined in your .env file or set in the environment.`);
    }
});

export const MONGODB_URI = process.env.MONGODB_URI as string;
export const HASH_SALT_ROUNDS = process.env.HASH_SALT_ROUNDS as string;
export const HASH_ALGORITHM = process.env.HASH_ALGORITHM as string;
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME as string;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL as string;
export const ADMIN_PHONE = process.env.ADMIN_PHONE as string;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
export const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION as string;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
export const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION as string;
export const HOST_EMAIL_ID = process.env.HOST_EMAIL_ID as string;
export const HOST_EMAIL_PASSKEY = process.env.HOST_EMAIL_PASSKEY as string;
export const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY as string;
export const MIN_THRESHOLD = process.env.MIN_THRESHOLD as string;
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

// Prefer .local.env if present, otherwise fallback to .env
const cwd = process.cwd();
const localEnvPath = path.resolve(cwd, ".local.env");
const defaultEnvPath = path.resolve(cwd, ".env");

if (fs.existsSync(localEnvPath)) {
dotenv.config({ path: localEnvPath });
} else {
dotenv.config({ path: defaultEnvPath });
}

// Helpers
const toNumber = (value, fallback = undefined) => {
if (value === undefined || value === null || value === "") return fallback;
const n = Number(value);
return Number.isNaN(n) ? fallback : n;
};

const toList = (value) => (value ? value.split(",").map((v) => v.trim()).filter(Boolean) : []);

// Centralized config object
const config = {
server: {
    port: toNumber(process.env.PORT, 3000),
    nodeEnv: process.env.NODE_ENV || "development",
},

db: {
    uri: process.env.DB_URI_LOCAL || process.env.DB_URI || process.env.MONGODB_URI,
},

jwt: {
    access: {
    secret: process.env.JWT_SECRET_ACCESS,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    },
    refresh: {
    secret: process.env.JWT_SECRET_REFRESH,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
},

crypto: {
    saltRounds: toNumber(process.env.SALT_ROUNDS, 10),
    ivLength: toNumber(process.env.IV_LENGTH, 16),
    encryptionSecretKey: process.env.ENCRYPTION_SECRET_KEY,
},

cors: {
    whiteListedOrigins: toList(process.env.WHITE_LISTED_ORIGIN),
},

google: {
    webClientId: process.env.WEB_CLIENT_ID,
},
};

export default config;

// Optional helper for CORS usage
export const buildCorsOptions = (whitelist = config.cors.whiteListedOrigins) => ({
origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) {
    return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
},
});



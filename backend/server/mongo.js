import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'quotify';

export const mongoState = {
  enabled: Boolean(MONGODB_URI),
  connected: false,
  lastSyncAt: null,
  lastSyncError: null,
  syncing: false,
};

export async function connectMongo() {
  if (!MONGODB_URI) return false;
  if (mongoState.connected) return true;

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  mongoState.connected = true;
  mongoState.enabled = true;
  return true;
}

export function getCollection(name) {
  if (!mongoState.connected) throw new Error('MongoDB not connected');
  return mongoose.connection.collection(name);
}

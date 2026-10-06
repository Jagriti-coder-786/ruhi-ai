import mongoose from 'mongoose';
import { env } from '@/config/env';

/**
 * Global cached Mongoose connection for Next.js App Router
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    const uri = env.MONGODB_URI;

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('✨ [Ruhi AI] MongoDB connected successfully to', uri.replace(/:([^:@]{1,})@/, ':****@'));
      return m;
    }).catch((err) => {
      console.error('❌ [Ruhi AI] MongoDB connection error:', err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

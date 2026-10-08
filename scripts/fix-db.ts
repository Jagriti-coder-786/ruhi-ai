import mongoose from 'mongoose';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function fixDb() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected!');

    const db = mongoose.connection.db;
    
    if (db) {
      const collection = db.collection('conversations');
      
      console.log('Removing shareToken: null from existing conversations...');
      const result = await collection.updateMany(
        { shareToken: null },
        { $unset: { shareToken: "" } }
      );
      console.log(`Updated ${result.modifiedCount} documents.`);

      console.log('Dropping shareToken index if it exists...');
      try {
        await collection.dropIndex('shareToken_1');
        console.log('Index dropped successfully.');
      } catch (e: any) {
        console.log('Index drop skipped or not found:', e.message);
      }
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixDb();

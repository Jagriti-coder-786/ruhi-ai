import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';

export async function GET() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');

    const collection = db.collection('conversations');
    
    // Remove null shareTokens
    const result = await collection.updateMany(
      { shareToken: null },
      { $unset: { shareToken: "" } }
    );

    // Drop the index
    try {
      await collection.dropIndex('shareToken_1');
    } catch (e: any) {
      console.log('Drop index failed or not needed:', e.message);
    }

    return NextResponse.json({ success: true, updated: result.modifiedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

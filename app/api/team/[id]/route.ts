import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
  }
  const team = await Team.findById(id)
    .populate('leaderId', 'name email')
    .populate('memberIds', 'name email')
    .lean();
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }
  return NextResponse.json({ team });
}

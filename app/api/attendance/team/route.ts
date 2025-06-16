import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Team from '@/lib/models/Team';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req) => {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const date = searchParams.get('date');

  // Only team-leader can access
  if (req.user!.role !== 'team-leader') {
    return NextResponse.json({ error: 'Only team leaders can view team attendance' }, { status: 403 });
  }

  // Check if leader owns the team
  const team = await Team.findById(teamId);
  if (!team || team.leaderId.toString() !== req.user!.userId) {
    return NextResponse.json({ error: 'Not your team' }, { status: 403 });
  }

  const filter: any = { teamId };
  if (date) filter.date = date;

  const attendance = await Attendance.find(filter)
    .populate('userId', 'name email')
    .populate('markedBy', 'name email')
    .sort({ timestamp: -1 });

  return NextResponse.json({ attendance });
});

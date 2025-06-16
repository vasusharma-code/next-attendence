import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Team from '@/lib/models/Team'; // Add this import
import { withRole } from '@/lib/middleware';

export const GET = withRole(['admin'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    // Ensure Team model is loaded
    require('@/lib/models/Team');
    
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type') || 'department';

    const query: any = {};
    if (date) query.date = date;

    // Add type-specific conditions
    if (type === 'department') {
      query.departmentId = { $exists: true };
    } else if (type === 'team') {
      query.teamId = { $exists: true };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email role')
      .populate('markedBy', 'name email role')
      .populate('departmentId', 'name')
      .populate('teamId', 'name')
      .sort({ timestamp: -1 });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
});

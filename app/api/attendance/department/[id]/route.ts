import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import { withRole } from '@/lib/middleware';

export const GET = withRole(['coordinator'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const departmentId = req.url.split('/department/')[1].split('?')[0];
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.find({
      departmentId
    })
    .populate('userId', 'name email')
    .populate('markedBy', 'name email')
    .sort({ timestamp: -1 })
    .limit(10);

    return NextResponse.json({ attendance });

  } catch (error) {
    console.error('Get department attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
});


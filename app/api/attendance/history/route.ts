import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req) => {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.user!.userId;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Check if user can view this attendance history
    if (userId !== req.user!.userId && !['admin', 'coordinator', 'team-leader'].includes(req.user!.role)) {
      return NextResponse.json(
        { error: 'You can only view your own attendance history' },
        { status: 403 }
      );
    }

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ userId })
      .populate('markedBy', 'name email')
      .populate('departmentId', 'name')
      .populate('teamId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Attendance.countDocuments({ userId });

    return NextResponse.json({
      attendance,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get attendance history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance history' },
      { status: 500 }
    );
  }
});
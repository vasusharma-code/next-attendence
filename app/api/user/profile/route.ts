import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req) => {
  try {
    await dbConnect();
    
    const user = await User.findById(req.user!.userId)
      .select('-password')
      .populate({
        path: 'departmentId',
        select: 'name description coordinatorIds volunteerIds',
        populate: {
          path: 'volunteerIds',
          select: 'name email',
          model: 'User'
        }
      })
      .populate('teamId', 'name description')
      .populate('coordinatorId', 'name email')
      .populate('teamLeaderId', 'name email');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
});
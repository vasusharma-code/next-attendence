import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Department from '@/lib/models/Department'; // Add this import
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req) => {
  try {
    await dbConnect();

    // Make sure Department model is loaded
    require('@/lib/models/Department');
    
    const user = await User.findById(req.user!.userId)
      .select('-password')
      .populate('departmentId', 'name description')
      .populate('teamId', 'name description')
      .lean();

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
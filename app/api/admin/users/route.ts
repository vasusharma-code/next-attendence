import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withRole } from '@/lib/middleware';

// GET all users
export const GET = withRole(['admin'])(async (req) => {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let query: any = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status === 'pending') {
      query.isApproved = false;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('departmentId', 'name')
      .populate('teamId', 'name')
      .populate('coordinatorId', 'name email')
      .populate('teamLeaderId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});
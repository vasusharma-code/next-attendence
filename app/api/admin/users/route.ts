import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const unassigned = searchParams.get('unassigned') === 'true';

    // Build query
    let query: any = {};
    
    // Only add role to query if specific role is requested
    if (role && role !== 'all') {
      query.role = role;
    } else {
      // For 'all', fetch all roles except admin
      query.role = { $ne: 'admin' };
    }

    // Add unassigned filter if requested
    if (unassigned) {
      query.departmentId = { $exists: false };
    }

    // Fetch users with query and sort by recent first
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
});
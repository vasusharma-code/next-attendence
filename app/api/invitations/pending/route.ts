import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invitation from '@/lib/models/Invitation';
import { withAuth } from '@/lib/middleware';

export const GET = withAuth(async (req) => {
  try {
    await dbConnect();

    const invitations = await Invitation.find({
      userId: req.user!.userId,
      status: 'pending'
    })
    .populate('departmentId', 'name')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Get pending invitations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending invitations' },
      { status: 500 }
    );
  }
});

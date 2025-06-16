import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invitation from '@/lib/models/Invitation';
import { withRole } from '@/lib/middleware';

export const GET = withRole(['coordinator'])(async (req) => {
  try {
    await dbConnect();
    
    const departmentId = req.url.split('/department/')[1].split('/pending')[0];

    const invitations = await Invitation.find({
      departmentId,
      status: 'pending'
    }).select('userId');

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error('Get department pending invitations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending invitations' },
      { status: 500 }
    );
  }
});

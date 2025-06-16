import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withRole } from '@/lib/middleware';

export const PATCH = withRole(['admin'])(async (req, { params }: { params: { id: string } }) => {
  try {
    await dbConnect();
    
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    user.isApproved = true;
    await user.save();

    return NextResponse.json({
      message: 'User approved successfully',
      user: { ...user.toObject(), password: undefined }
    });

  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: 'Failed to approve user' },
      { status: 500 }
    );
  }
});
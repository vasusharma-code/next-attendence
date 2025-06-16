import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Invitation from '@/lib/models/Invitation'; // Add this import
import { withRole } from '@/lib/middleware';
import { z } from 'zod';

const inviteSchema = z.object({
  userId: z.string(),
  departmentId: z.string(),
});

export const GET = withRole(['coordinator'])(async (req) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';

    // Find volunteers without a department and matching the search query
    const volunteers = await User.find({
      role: 'volunteer',
      departmentId: { $exists: false },
      name: { $regex: query, $options: 'i' }
    }).select('name email');

    return NextResponse.json({ volunteers });
  } catch (error) {
    console.error('Search volunteers error:', error);
    return NextResponse.json(
      { error: 'Failed to search volunteers' },
      { status: 500 }
    );
  }
});

export const POST = withRole(['coordinator'])(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, departmentId } = inviteSchema.parse(body);

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      userId,
      departmentId,
      status: 'pending'
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent' },
        { status: 400 }
      );
    }

    // Create new invitation
    const invitation = new Invitation({
      userId,
      departmentId,
      invitedBy: req.user!.userId,
      status: 'pending'
    });

    await invitation.save();

    // Populate invitation details for response
    await invitation.populate([
      { path: 'userId', select: 'name email' },
      { path: 'departmentId', select: 'name' },
      { path: 'invitedBy', select: 'name email' }
    ]);

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
});

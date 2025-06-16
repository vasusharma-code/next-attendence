import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Invitation from '@/lib/models/Invitation';
import Department from '@/lib/models/Department';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const responseSchema = z.object({
  status: z.enum(['accepted', 'rejected'])
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const invitationId = req.url.split('/invitations/')[1].split('/respond')[0];
    const body = await req.json();
    const { status } = responseSchema.parse(body);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invitation = await Invitation.findById(invitationId)
        .session(session);

      if (!invitation) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
      }

      if (invitation.userId.toString() !== req.user!.userId) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      invitation.status = status;
      await invitation.save({ session });

      if (status === 'accepted') {
        // Update department and user
        await Department.findByIdAndUpdate(
          invitation.departmentId,
          { $addToSet: { volunteerIds: invitation.userId } },
          { session }
        );

        await User.findByIdAndUpdate(
          invitation.userId,
          { departmentId: invitation.departmentId },
          { session }
        );
      }

      await session.commitTransaction();

      return NextResponse.json({
        message: `Invitation ${status} successfully`
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Respond to invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to invitation' },
      { status: 500 }
    );
  }
});

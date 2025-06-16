import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Department from '@/lib/models/Department';
import { withRole } from '@/lib/middleware';

export const DELETE = withRole(['coordinator'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    // Get volunteer ID from URL
    const volunteerId = req.url.split('/volunteers/')[1].split('/remove')[0];

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [volunteer, coordinator] = await Promise.all([
        User.findById(volunteerId).session(session),
        User.findById(req.user!.userId).session(session)
      ]);

      if (!volunteer || !coordinator) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Volunteer or coordinator not found' }, { status: 404 });
      }

      // Verify the volunteer belongs to coordinator's department
      if (volunteer.departmentId?.toString() !== coordinator.departmentId?.toString()) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Unauthorized to remove this volunteer' }, { status: 403 });
      }

      // Update department by removing volunteer
      await Department.findByIdAndUpdate(
        coordinator.departmentId,
        { $pull: { volunteerIds: volunteerId } },
        { session }
      );

      // Remove department from volunteer
      volunteer.departmentId = undefined;
      await volunteer.save({ session });

      await session.commitTransaction();

      return NextResponse.json({
        message: 'Volunteer removed successfully'
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Remove volunteer error:', error);
    return NextResponse.json(
      { error: 'Failed to remove volunteer' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Department from '@/lib/models/Department';
import { withRole } from '@/lib/middleware';
import { z } from 'zod';

const promoteSchema = z.object({
  newRole: z.enum(['coordinator']),
});

export const PATCH = withRole(['admin'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    // Get user ID from URL
    const userId = req.url.split('/users/')[1].split('/promote')[0];
    const body = await req.json();
    const { newRole } = promoteSchema.parse(body);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      
      if (!user) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (user.role !== 'volunteer') {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Only volunteers can be promoted to coordinator' }, { status: 400 });
      }

      // Store the old department ID before updating
      const oldDepartmentId = user.departmentId;

      // Update user's role
      user.role = newRole;
      await user.save({ session });

      // Update old department if exists
      if (oldDepartmentId) {
        const department = await Department.findById(oldDepartmentId).session(session);
        if (department) {
          department.volunteerIds = department.volunteerIds.filter(
            id => id.toString() !== userId
          );
          department.coordinatorIds.push(userId);
          await department.save({ session });
        }
      }

      await session.commitTransaction();

      return NextResponse.json({
        message: 'User promoted successfully',
        user: { ...user.toObject(), password: undefined }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Promote user error:', error);
    return NextResponse.json(
      { error: 'Failed to promote user' },
      { status: 500 }
    );
  }
});

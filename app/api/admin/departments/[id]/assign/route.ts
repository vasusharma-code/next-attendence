import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Department from '@/lib/models/Department';
import User from '@/lib/models/User';
import { withRole } from '@/lib/middleware';

export const POST = withRole(['admin'])(async (req: NextRequest) => {
  try {
    await dbConnect();

    // Extract department ID from URL
    const departmentId = req.url.split('/departments/')[1].split('/assign')[0];

    // Parse request body
    const body = await req.json();
    const { userId, role }: { userId: string; role: 'coordinator' | 'volunteer' } = body;

    // Start MongoDB transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Fetch department and user
      const [department, user] = await Promise.all([
        Department.findById(departmentId).session(session),
        User.findById(userId).session(session),
      ]);

      if (!department || !user) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: 'Department or user not found' },
          { status: 404 }
        );
      }

      // Remove user from previous department if exists
      if (user.departmentId) {
        const oldDepartment = await Department.findById(user.departmentId).session(session);
        if (oldDepartment) {
          if (user.role === 'coordinator') {
            oldDepartment.coordinatorIds = oldDepartment.coordinatorIds.filter((id: Types.ObjectId) =>
              id.toString() !== userId
            );
          } else {
            oldDepartment.volunteerIds = oldDepartment.volunteerIds.filter((id: Types.ObjectId) =>
              id.toString() !== userId
            );
          }
          await oldDepartment.save({ session });
        }
      }

      // Assign user to new department
      user.departmentId = department._id;
      await user.save({ session });

      // Add user to coordinator or volunteer list
      if (role === 'coordinator') {
        if (!department.coordinatorIds.some((id: Types.ObjectId) => id.toString() === userId)) {
          department.coordinatorIds.push(new mongoose.Types.ObjectId(userId));
        }
      } else {
        if (!department.volunteerIds.some((id: Types.ObjectId) => id.toString() === userId)) {
          department.volunteerIds.push(new mongoose.Types.ObjectId(userId));
        }
      }

      await department.save({ session });

      await session.commitTransaction();

      return NextResponse.json({
        message: 'User assigned to department successfully',
      });

    } catch (error) {
      await session.abortTransaction();
      console.error('Transaction error:', error);
      return NextResponse.json(
        { error: 'Failed during assignment transaction' },
        { status: 500 }
      );
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Assign to department error:', error);
    return NextResponse.json(
      { error: 'Failed to assign user to department' },
      { status: 500 }
    );
  }
});

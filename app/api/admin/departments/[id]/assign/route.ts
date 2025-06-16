import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Department from '@/lib/models/Department';
import User from '@/lib/models/User';
import { withRole } from '@/lib/middleware';

export const POST = withRole(['admin'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const departmentId = req.url.split('/departments/')[1].split('/assign')[0];
    const body = await req.json();
    const { userId, role } = body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [department, user] = await Promise.all([
        Department.findById(departmentId).session(session),
        User.findById(userId).session(session)
      ]);

      if (!department || !user) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'Department or user not found' }, { status: 404 });
      }

      // Remove user from previous department if exists
      if (user.departmentId) {
        const oldDepartment = await Department.findById(user.departmentId).session(session);
        if (oldDepartment) {
          if (user.role === 'coordinator') {
            oldDepartment.coordinatorIds = oldDepartment.coordinatorIds.filter(id => 
              id.toString() !== userId
            );
          } else {
            oldDepartment.volunteerIds = oldDepartment.volunteerIds.filter(id => 
              id.toString() !== userId
            );
          }
          await oldDepartment.save({ session });
        }
      }

      // Add user to new department
      user.departmentId = department._id;
      await user.save({ session });

      // Update department members
      if (role === 'coordinator') {
        if (!department.coordinatorIds.includes(userId)) {
          department.coordinatorIds.push(userId);
        }
      } else {
        if (!department.volunteerIds.includes(userId)) {
          department.volunteerIds.push(userId);
        }
      }
      await department.save({ session });

      await session.commitTransaction();

      return NextResponse.json({
        message: 'User assigned to department successfully'
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
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

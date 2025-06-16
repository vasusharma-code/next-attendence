import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Department from '@/lib/models/Department';
import User from '@/lib/models/User';
import { withRole } from '@/lib/middleware';

export const DELETE = withRole(['admin'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const departmentId = pathParts[pathParts.indexOf('departments') + 1];

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find department and its users
      const department = await Department.findById(departmentId).session(session);
      if (!department) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 404 }
        );
      }

      // Update all users in this department
      await User.updateMany(
        { departmentId: departmentId },
        { $unset: { departmentId: "" } },
        { session }
      );

      // Soft delete the department
      department.isActive = false;
      await department.save({ session });

      await session.commitTransaction();

      return NextResponse.json({
        message: 'Department deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
});

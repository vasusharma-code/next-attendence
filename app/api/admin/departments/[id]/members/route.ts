import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Department from '@/lib/models/Department';
import User from '@/lib/models/User';
import { withRole } from '@/lib/middleware';

// GET current members and available users
export const GET = withRole(['admin'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    // Get department ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const departmentId = pathParts[pathParts.indexOf('departments') + 1];

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    // Get department with its members
    const department = await Department.findById(departmentId)
      .populate('coordinatorIds', 'name email')
      .populate('volunteerIds', 'name email');

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Get available users
    const [availableCoordinators, availableVolunteers] = await Promise.all([
      User.find({
        role: 'coordinator',
        departmentId: { $exists: false }
      }).select('name email'),
      User.find({
        role: 'volunteer',
        departmentId: { $exists: false }
      }).select('name email')
    ]);

    return NextResponse.json({
      coordinators: department.coordinatorIds || [],
      volunteers: department.volunteerIds || [],
      available: {
        coordinators: availableCoordinators,
        volunteers: availableVolunteers
      }
    });

  } catch (error) {
    console.error('Get department members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department members' },
      { status: 500 }
    );
  }
});

// POST assign member
export const POST = withRole(['admin'])(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const departmentId = pathParts[pathParts.indexOf('departments') + 1];
    
    const body = await req.json();
    const { userId, role } = body;

    if (!mongoose.Types.ObjectId.isValid(departmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid department or user ID' },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [department, user] = await Promise.all([
        Department.findById(departmentId).session(session),
        User.findById(userId).session(session)
      ]);

      if (!department || !user) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: 'Department or user not found' },
          { status: 404 }
        );
      }

      // Check if user is already assigned to any department
      if (user.departmentId) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: 'User is already assigned to a department' },
          { status: 400 }
        );
      }

      // Update department members
      const field = role === 'coordinator' ? 'coordinatorIds' : 'volunteerIds';
      if (!department[field].includes(userId)) {
        department[field].push(userId);
        await department.save({ session });
      }

      // Update user's department
      user.departmentId = department._id;
      await user.save({ session });

      await session.commitTransaction();
      return NextResponse.json({
        message: `${role} assigned successfully`
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Assign member error:', error);
    return NextResponse.json(
      { error: 'Failed to assign member' },
      { status: 500 }
    );
  }
});

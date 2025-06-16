import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Attendance from '@/lib/models/Attendance';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const markAttendanceSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

export const POST = withAuth(async (req) => {
  try {
    await dbConnect();
    
    const body = await req.json();
    const validatedData = markAttendanceSchema.parse(body);
    
    // Find user by QR code
    const targetUser = await User.findOne({ qrCode: validatedData.qrCode })
      .populate('departmentId')
      .populate('teamId')
      .populate('coordinatorId');

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 400 }
      );
    }

    // Get current user (the one marking attendance)
    const currentUser = await User.findById(req.user!.userId)
      .populate('departmentId');
      
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Allow coordinators to mark attendance for volunteers in their department
    if (currentUser.role === 'coordinator') {
      if (!targetUser.departmentId || !currentUser.departmentId) {
        return NextResponse.json(
          { error: 'Department information missing' },
          { status: 400 }
        );
      }

      if (targetUser.departmentId._id.toString() !== currentUser.departmentId._id.toString()) {
        return NextResponse.json(
          { error: 'You can only mark attendance for volunteers in your department' },
          { status: 403 }
        );
      }
    }

    // Check if attendance already marked today
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await Attendance.findOne({
      userId: targetUser._id,
      date: today
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance already marked for today' },
        { status: 400 }
      );
    }

    // Create attendance record with timestamp
    const now = new Date();
    const attendance = new Attendance({
      userId: targetUser._id,
      markedBy: currentUser._id,
      role: targetUser.role,
      departmentId: targetUser.departmentId?._id,
      teamId: targetUser.teamId?._id,
      date: now.toISOString().split('T')[0],
      timestamp: now,
      location: validatedData.location,
    });

    await attendance.save();

    // Populate the attendance record for response
    await attendance.populate([
      { path: 'userId', select: 'name email role' },
      { path: 'markedBy', select: 'name email' }
    ]);

    return NextResponse.json({
      message: 'Attendance marked successfully',
      attendance
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
});

async function canMarkAttendance(marker: any, target: any): Promise<{ allowed: boolean; reason?: string }> {
  // Admin can mark anyone's attendance
  if (marker.role === 'admin') {
    return { allowed: true };
  }

  // Coordinator can mark volunteers in their department
  if (marker.role === 'coordinator' && target.role === 'volunteer') {
    if (target.coordinatorId?.toString() === marker._id.toString()) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'You can only mark attendance for volunteers in your department' };
  }

  // Team leader can mark team members
  if (marker.role === 'team-leader' && target.role === 'team-member') {
    if (target.teamLeaderId?.toString() === marker._id.toString()) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'You can only mark attendance for your team members' };
  }

  return { allowed: false, reason: 'You do not have permission to mark this person\'s attendance' };
}
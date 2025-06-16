import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Department from '@/lib/models/Department';
import { withRole } from '@/lib/middleware';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
});

// GET all departments
export const GET = withRole(['admin'])(async (req) => {
  try {
    await dbConnect();
    
    const departments = await Department.find({ isActive: true })
      .populate('coordinatorIds', 'name email')
      .populate('volunteerIds', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
});

// POST create department
export const POST = withRole(['admin'])(async (req) => {
  try {
    await dbConnect();
    
    const body = await req.json();
    const validatedData = createDepartmentSchema.parse(body);

    // Check if department already exists
    const existingDept = await Department.findOne({ 
      name: validatedData.name,
      isActive: true 
    });

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      );
    }

    const department = new Department(validatedData);
    await department.save();

    return NextResponse.json({
      message: 'Department created successfully',
      department
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create department error:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
});
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, generateQRCode } from '@/lib/auth';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['volunteer', 'team-leader', 'team-member']),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: validatedData.email },
        { phone: validatedData.phone }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 400 }
      );
    }

    // Hash password and generate QR code
    const hashedPassword = await hashPassword(validatedData.password);
    const qrCode = generateQRCode();

    // Create user
    const user = new User({
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      password: hashedPassword,
      role: validatedData.role,
      qrCode,
      isApproved: true, // Always approved
    });

    await user.save();

    // Return user data without password
    const { password, ...userWithoutPassword } = user.toObject();
    
    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword,
      needsApproval: false // No approval needed for any role
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
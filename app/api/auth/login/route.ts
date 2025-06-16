import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { comparePassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['admin', 'coordinator', 'volunteer', 'team-leader', 'team-member']),
});

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    // Handle admin login with environment variables
    if (validatedData.role === 'admin') {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (validatedData.email === adminEmail && validatedData.password === adminPassword) {
        const token = generateToken({
          userId: 'admin',
          email: adminEmail!,
          role: 'admin',
        });

        const response = NextResponse.json({
          message: 'Login successful',
          user: {
            id: 'admin',
            email: adminEmail,
            role: 'admin',
            name: 'Administrator'
          }
        });

        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;
      } else {
        return NextResponse.json(
          { error: 'Invalid admin credentials' },
          { status: 401 }
        );
      }
    }

    // Regular user login
    const user = await User.findOne({ 
      email: validatedData.email,
      role: validatedData.role 
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found with this role' },
        { status: 401 }
      );
    }

    // Check if team leader is approved
    if (user.role === 'team-leader' && !user.isApproved) {
      return NextResponse.json(
        { error: 'Your account is pending approval by admin' },
        { status: 403 }
      );
    }

    const isPasswordValid = await comparePassword(validatedData.password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Return user data without password
    const { password, ...userWithoutPassword } = user.toObject();

    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
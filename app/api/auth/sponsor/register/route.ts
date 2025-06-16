import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const organization = formData.get('organization') as string;
    const password = formData.get('password') as string;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user without file uploads
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'sponsor',
      organization,
      isApproved: false,
    });

    await user.save();

    return NextResponse.json({
      message: 'Registration successful, awaiting approval',
    }, { status: 201 });

  } catch (error) {
    console.error('Sponsor registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';

export const POST = withAuth(async (req) => {
  try {
    await dbConnect();
    const { joinCode } = await req.json();

    // Find team by join code and populate required fields
    const team = await Team.findOne({ joinCode })
      .populate('leaderId', 'name email')
      .populate('memberIds', 'name email');

    if (!team) {
      return NextResponse.json({ error: 'Invalid team code' }, { status: 400 });
    }

    // Verify team has a leader
    if (!team.leaderId) {
      return NextResponse.json({ error: 'Team has no assigned leader' }, { status: 400 });
    }

    // Update user's team
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.teamId) {
      return NextResponse.json({ error: 'Already a member of a team' }, { status: 400 });
    }

    // Add user to team members
    if (!team.memberIds.includes(user._id)) {
      team.memberIds.push(user._id);
      await team.save();
    }

    // Update user's team reference
    user.teamId = team._id;
    await user.save();

    return NextResponse.json({
      message: 'Successfully joined team',
      team
    });

  } catch (error) {
    console.error('Join team error:', error);
    return NextResponse.json(
      { error: 'Failed to join team' },
      { status: 500 }
    );
  }
});

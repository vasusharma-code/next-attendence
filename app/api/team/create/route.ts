import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name is required'),
  description: z.string().optional(),
});

function generateTeamCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const POST = withAuth(async (req) => {
  await dbConnect();
  const body = await req.json();
  const { name, description } = createTeamSchema.parse(body);
  const leaderId = req.user!.userId;

  // Only team-leader can create a team
  const leader = await User.findById(leaderId);
  if (!leader || leader.role !== 'team-leader') {
    return NextResponse.json({ error: 'Only team leaders can create teams' }, { status: 403 });
  }

  // Check if already has a team
  let team = await Team.findOne({ leaderId });
  if (team) {
    // Ensure leader's teamId is set
    if (!leader.teamId || leader.teamId.toString() !== team._id.toString()) {
      leader.teamId = team._id;
      await leader.save();
    }
    // Populate for dashboard
    await team.populate('memberIds', 'name email');
    return NextResponse.json({ team });
  }

  // Generate unique join code
  let joinCode: string;
  let codeExists = true;
  while (codeExists) {
    joinCode = generateTeamCode();
    codeExists = await Team.exists({ joinCode });
  }

  team = new Team({
    name,
    description,
    leaderId,
    memberIds: [],
    joinCode,
  });
  await team.save();

  // Update leader's teamId
  leader.teamId = team._id;
  await leader.save();

  await team.populate('memberIds', 'name email');

  return NextResponse.json({ team });
});

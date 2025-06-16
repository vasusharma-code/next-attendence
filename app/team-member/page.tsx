'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import { Users, UserCheck, CheckCircle, Clock, User } from 'lucide-react';

interface Team {
  _id: string;
  name: string;
  description?: string;
  joinCode: string;
  memberIds: { _id: string; name: string; email: string }[];
  leaderId: { _id: string; name: string; email: string }; // Add leaderId to interface
}

interface AttendanceRecord {
  _id: string;
  timestamp: string;
  markedBy: {
    name: string;
    email: string;
    role: string; // Add role to interface
  };
  departmentId?: {
    name: string;
  };
}

interface UserType {
  _id: string;
  name: string;
  email: string;
  role: string;
  qrCode: string;
  teamId?: Team;
}

export default function TeamMemberPage() {
  const [code, setCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user.teamId) {
          // Fetch full team info with leader and members
          let teamId = data.user.teamId;
          if (teamId && typeof teamId === 'object' && teamId._id) {
            teamId = teamId._id;
          }
          const teamRes = await fetch(`/api/team/${teamId}`);
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            setTeam(teamData.team);
            setJoined(true);
            fetchAttendance();
          } else {
            setTeam(null);
            setJoined(false);
          }
        } else {
          setTeam(null);
          setJoined(false);
        }
      }
    } catch {
      setTeam(null);
      setJoined(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/history?limit=10');
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
      }
    } catch {
      toast.error('Failed to fetch attendance');
    }
  };

  const fetchTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/team/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        // Make sure team data includes populated leaderId
        if (!data.team.leaderId) {
          throw new Error('Team has no leader assigned');
        }
        setTeam(data.team);
        setJoined(true);
      }
    } catch (error) {
      toast.error('Failed to load team details');
      setTeam(null);
      setJoined(false);
    }
  };

  const handleJoin = async () => {
    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // After joining, fetch complete team details
        await fetchTeam(data.team._id);
        toast.success('Joined team successfully');
      } else {
        throw new Error(data.error || 'Invalid team code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to join team');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not joined, show join form
  if (!joined || !team || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto py-16">
          <Card>
            <CardHeader>
              <CardTitle>Join a Team</CardTitle>
              <CardDescription>
                Enter the team code provided by your Team Leader to join your team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                placeholder="Enter Team Code"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="border rounded px-3 py-2 w-full mb-4"
                maxLength={6}
              />
              <Button className="w-full" onClick={handleJoin} disabled={!code}>
                Join Team
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Team member dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Information
            </CardTitle>
            <CardDescription>
              Details about your team and members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{team.name}</h3>
                {team.description && (
                  <p className="text-gray-600">{team.description}</p>
                )}
              </div>
              
              <div>
                <p className="font-medium mb-1">Team Leader:</p>
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{team.leaderId.name}</p>
                    <p className="text-sm text-gray-600">{team.leaderId.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium mb-1">Team Members:</p>
                <div className="space-y-2">
                  {team.memberIds.map((member) => (
                    <div 
                      key={member._id} 
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        member._id === user?._id ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className="font-medium">
                          {member.name} {member._id === user?._id && '(You)'}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={member._id === user?._id ? 
                          'border-green-600 text-green-600' : 
                          'border-gray-600 text-gray-600'
                        }
                      >
                        Member
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Your QR Code
            </CardTitle>
            <CardDescription>
              Show this QR code to your Team Leader for attendance marking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QRCodeDisplay
              qrCode={user.qrCode}
              userName={user.name}
              userRole={user.role}
            />
          </CardContent>
        </Card>

        {/* Attendance Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Attendance Logs
            </CardTitle>
            <CardDescription>
              Your recent attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{formatDate(record.timestamp)}</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Marked by: {record.markedBy.name}</p>
                        <p>Role: {record.markedBy.role.replace('-', ' ')}</p>
                        <p>Email: {record.markedBy.email}</p>
                      </div>
                      {record.departmentId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Department: {record.departmentId.name}
                        </p>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No attendance records yet</p>
                  <p className="text-sm text-gray-500">Your attendance will appear here once marked</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


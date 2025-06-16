'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import QRScanner from '@/components/qr/QRScanner';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  QrCode,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Team {
  _id: string;
  name: string;
  description?: string;
  joinCode: string;
  memberIds: { _id: string; name: string; email: string }[];
}

interface AttendanceRecord {
  _id: string;
  userId: { name: string; email: string };
  markedBy: { 
    name: string; 
    email: string;
    role: string; // Add role to interface
  };
  timestamp: string;
  date: string;
}

export default function TeamLeaderDashboard() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState<string>('');
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchTeam();
    fetchUser();
    // eslint-disable-next-line
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // ignore error, fallback to default navbar
    }
  };

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        // Fix: always use string id for teamId
        let teamId = data.user.teamId;
        if (teamId && typeof teamId === 'object' && teamId._id) {
          teamId = teamId._id;
        }
        if (typeof teamId === 'string') {
          const teamRes = await fetch(`/api/team/${teamId}`);
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            setTeam(teamData.team);
            fetchAttendance(teamData.team._id, attendanceDate);
            setShowCreateSection(false); // Hide create section if team exists
          } else {
            setTeam(null);
          }
        } else {
          setTeam(null);
        }
      }
    } catch (e) {
      toast.error('Failed to load team info');
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async (teamId: string, date?: string) => {
    try {
      let url = `/api/attendance/team?teamId=${teamId}`;
      if (date) url += `&date=${date}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
      }
    } catch {
      toast.error('Failed to fetch attendance');
    }
  };

  const handleQRScan = async (qrCode: string) => {
    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Attendance marked for ${data.attendance.userId.name}`);
        setShowScanner(false);
        fetchAttendance(team!._id, attendanceDate);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark attendance');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error('Team name is required');
      return;
    }
    setCreatingTeam(true);
    try {
      const res = await fetch('/api/team/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName, description: newTeamDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeam(data.team);
        setShowCreateSection(false);
        setNewTeamName('');
        setNewTeamDescription('');
        fetchAttendance(data.team._id, attendanceDate);
        toast.success('Team created!');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create team');
    } finally {
      setCreatingTeam(false);
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
        <Navbar user={user || undefined} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Usual dashboard header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Leader Dashboard</h1>
            <p className="text-gray-600">Manage your team and attendance</p>
          </div>
          <div className="flex gap-2">
            {!team && !showCreateSection && (
              <Button onClick={() => setShowCreateSection(true)}>
                + Create Team
              </Button>
            )}
            {team && (
              <Button onClick={() => setShowScanner(!showScanner)}>
                <QrCode className="mr-2 h-4 w-4" />
                {showScanner ? 'Close Scanner' : 'Scan QR Code'}
              </Button>
            )}
          </div>
        </div>

        {/* Show create team section if requested and no team exists */}
        {!team && showCreateSection && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Your Team</CardTitle>
              <CardDescription>
                Enter a team name (required) and description (optional), then add members after creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Team Name"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTeamDescription}
                  onChange={e => setNewTeamDescription(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={creatingTeam}>
                  {creatingTeam ? 'Creating...' : 'Create Team'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Usual dashboard content if team exists */}
        {team && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Team"
                value={team?.name || 'No Team'}
                description="Your team"
                icon={Users}
              />
              <StatsCard
                title="Members"
                value={team?.memberIds.length || 0}
                description="Team members"
                icon={Users}
              />
              <StatsCard
                title="Team Code"
                value={team?.joinCode || '-'}
                description="Share with members to join"
                icon={Plus}
              />
              <StatsCard
                title="Attendance"
                value={attendance.length}
                description="Attendance records"
                icon={CheckCircle}
              />
            </div>

            {/* QR Scanner */}
            {showScanner && (
              <div className="flex justify-center">
                <QRScanner 
                  onScanSuccess={handleQRScan}
                  onScanError={(error) => toast.error(error)}
                />
              </div>
            )}

            {/* Team Info */}
            {team && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Share the code <span className="font-mono bg-gray-100 px-2 py-1 rounded">{team.joinCode}</span> with members to join.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {team.memberIds.length > 0 ? (
                      team.memberIds.map((member) => (
                        <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Member
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No team members yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attendance Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  Attendance Logs
                </CardTitle>
                <CardDescription>
                  Filter by date to view attendance records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <input
                    type="date"
                    className="border rounded px-3 py-2"
                    value={attendanceDate}
                    onChange={e => {
                      setAttendanceDate(e.target.value);
                      if (team) fetchAttendance(team._id, e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-3">
                  {attendance.length > 0 ? (
                    attendance.map((record) => (
                      <div key={record._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">{record.userId.name}</p>
                          <div>
                            <p className="text-sm text-gray-600">{formatDate(record.timestamp)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-600">Marked by:</span>
                              <Badge variant="outline" className="text-blue-600">
                                {record.markedBy.name} ({record.markedBy.role.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Present
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No attendance records</p>
                      <p className="text-sm text-gray-500">Attendance will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

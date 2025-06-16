'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Calendar, 
  User,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface VolunteerData {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    qrCode: string;
    departmentId?: {
      name: string;
      description: string;
    };
  };
}

interface AttendanceRecord {
  _id: string;
  timestamp: string;
  markedBy: {
    name: string;
    email: string;
  };
  departmentId?: {
    name: string;
  };
}

interface Invitation {
  _id: string;
  departmentId: {
    _id: string;
    name: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function VolunteerDashboard() {
  const router = useRouter();
  const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, attendanceRes, invitationsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/attendance/history?limit=10'),
        fetch('/api/invitations/pending')
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setVolunteerData(profileData);
      } else if (profileRes.status === 401) {
        router.push('/login');
        return;
      } else {
        const errorText = await profileRes.text();
        console.error('Profile API error:', errorText);
        throw new Error(`Profile API error: ${profileRes.status} ${profileRes.statusText}`);
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData.attendance);
      } else {
        const errorText = await attendanceRes.text();
        console.error('Attendance API error:', errorText);
        throw new Error(`Attendance API error: ${attendanceRes.status} ${attendanceRes.statusText}`);
      }

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json();
        setInvitations(invitationsData.invitations);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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

  const getAttendanceThisMonth = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    return attendance.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    }).length;
  };

  const respondToInvitation = async (invitationId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Invitation ${status} successfully`);
        fetchData(); // Refresh data
      } else {
        throw new Error('Failed to respond to invitation');
      }
    } catch (error) {
      toast.error('Failed to respond to invitation');
    }
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

  if (!volunteerData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600">Failed to load profile data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={volunteerData.user} />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Dashboard</h1>
          <p className="text-gray-600">Welcome back, {volunteerData.user.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Attendance"
            value={attendance.length}
            description="All time attendance records"
            icon={CheckCircle}
          />
          <StatsCard
            title="This Month"
            value={getAttendanceThisMonth()}
            description="Attendance this month"
            icon={Calendar}
          />
          <StatsCard
            title="Department"
            value={volunteerData.user.departmentId?.name || 'Not Assigned'}
            description="Your assigned department"
            icon={Building2}
          />
          <StatsCard
            title="Status"
            value="Active"
            description="Account status"
            icon={User}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="space-y-6">
            <QRCodeDisplay
              qrCode={volunteerData.user.qrCode}
              userName={volunteerData.user.name}
              userRole={volunteerData.user.role}
            />

            {/* Department Info */}
            {volunteerData.user.departmentId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Department Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{volunteerData.user.departmentId.name}</p>
                    <p className="text-gray-600">{volunteerData.user.departmentId.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                Recent Attendance
              </CardTitle>
              <CardDescription>
                Your attendance history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length > 0 ? (
                <div className="space-y-3">
                  {attendance.map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{formatDate(record.timestamp)}</p>
                        <p className="text-sm text-gray-600">
                          Marked by: {record.markedBy.name}
                        </p>
                        {record.departmentId && (
                          <p className="text-xs text-gray-500">
                            Department: {record.departmentId.name}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No attendance records yet</p>
                  <p className="text-sm text-gray-500">Your attendance will appear here once marked</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Department Invitations
              </CardTitle>
              <CardDescription>Pending invitations to join departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{invitation.departmentId.name}</p>
                      <p className="text-sm text-gray-600">
                        Invited by {invitation.invitedBy.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => respondToInvitation(invitation._id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToInvitation(invitation._id, 'rejected')}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
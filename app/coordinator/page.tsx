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
  Building2, 
  CheckCircle,
  Clock,
  QrCode,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import VolunteerSearchDialog from '@/components/dialogs/VolunteerSearchDialog';

interface CoordinatorData {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    departmentId?: {
      _id: string;
      name: string;
      description: string;
      volunteerIds: {
        _id: string;
        name: string;
        email: string;
      }[];
    };
  };
}

interface AttendanceRecord {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  timestamp: string;
  date: string;
}

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [coordinatorData, setCoordinatorData] = useState<CoordinatorData | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showVolunteerSearch, setShowVolunteerSearch] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const profileRes = await fetch('/api/user/profile');
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setCoordinatorData(profileData);
        
        // Fetch recent attendance for the department
        if (profileData.user.departmentId) {
          const attendanceRes = await fetch(`/api/attendance/department/${profileData.user.departmentId._id}`);
          if (attendanceRes.ok) {
            const attendanceData = await attendanceRes.json();
            setRecentAttendance(attendanceData.attendance);
          }
        }
      } else if (profileRes.status === 401) {
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
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
        fetchData(); // Refresh data
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark attendance');
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

  const getVolunteersCount = () => {
    if (!coordinatorData?.user?.departmentId) return 0;
    return coordinatorData.user.departmentId.volunteerIds?.length || 0;
  };

  const removeVolunteer = async (volunteerId: string) => {
    try {
      const response = await fetch(`/api/coordinator/volunteers/${volunteerId}/remove`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Volunteer removed successfully');
        fetchData(); // Refresh data
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove volunteer');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove volunteer');
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

  if (!coordinatorData) {
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
      <Navbar user={coordinatorData.user} />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
            <p className="text-gray-600">Manage your department and volunteers</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowScanner(!showScanner)}>
              <QrCode className="mr-2 h-4 w-4" />
              {showScanner ? 'Close Scanner' : 'Scan QR Code'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Department"
            value={coordinatorData.user.departmentId?.name || 'Not Assigned'}
            description="Your assigned department"
            icon={Building2}
          />
          <StatsCard
            title="Volunteers"
            value={getVolunteersCount()}
            description="Under your supervision"
            icon={Users}
          />
          <StatsCard
            title="Today's Attendance"
            value={0}
            description="Marked today"
            icon={CheckCircle}
          />
          <StatsCard
            title="Pending Tasks"
            value={0}
            description="Require attention"
            icon={Clock}
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Information */}
          {coordinatorData.user.departmentId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    Department Details
                  </div>
                  <Button size="sm" onClick={() => setShowVolunteerSearch(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Volunteer
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{coordinatorData.user.departmentId.name}</h3>
                  <p className="text-gray-600">{coordinatorData.user.departmentId.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Volunteers:</p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {coordinatorData.user.departmentId.volunteerIds.length > 0 ? (
                      coordinatorData.user.departmentId.volunteerIds.map((volunteer) => (
                        <div 
                          key={volunteer._id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{volunteer.name}</p>
                            <p className="text-sm text-gray-600">{volunteer.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to remove this volunteer?')) {
                                removeVolunteer(volunteer._id);
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No volunteers in this department yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                Recent Attendance
              </CardTitle>
              <CardDescription>
                Latest attendance records from your department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {recentAttendance.map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{record.userId.name}</p>
                        <p className="text-sm text-gray-600">{formatDate(record.timestamp)}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Present
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No recent attendance</p>
                  <p className="text-sm text-gray-500">Attendance records will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        
        {/* Add volunteer search dialog */}
        {showVolunteerSearch && coordinatorData.user.departmentId && (
          <VolunteerSearchDialog
            open={showVolunteerSearch}
            onClose={() => setShowVolunteerSearch(false)}
            departmentId={coordinatorData.user.departmentId._id}
          />
        )}
      </div>
    </div>
  );
}
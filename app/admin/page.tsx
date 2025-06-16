'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  UserCheck, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import DepartmentManageDialog from '@/components/dialogs/DepartmentManageDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

interface Department {
  _id: string;
  name: string;
  coordinatorIds: any[];
  volunteerIds: any[];
}

interface AttendanceRecord {
  _id: string;
  userId: { 
    name: string; 
    email: string; 
    role: string;
  };
  markedBy: { 
    name: string; 
    email: string;
    role: string;  // Add role to markedBy interface
  };
  timestamp: string;
  date: string;
  departmentId?: { name: string };
  teamId?: { name: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>('');
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'department' | 'team'>('department');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, departmentsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/departments')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (departmentsRes.ok) {
        const deptData = await departmentsRes.json();
        setDepartments(deptData.departments);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const promoteToCoordinator = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole: 'coordinator' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('User promoted to coordinator successfully');
        fetchData(); // Refresh all data to update lists
      } else {
        throw new Error(data.error || 'Failed to promote user');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to promote user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'coordinator': 'bg-purple-100 text-purple-800',
      'volunteer': 'bg-blue-100 text-blue-800',
      'team-leader': 'bg-emerald-100 text-emerald-800',
      'team-member': 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const fetchUsersByRole = async (role: string) => {
    try {
      const endpoint = role === 'all' 
        ? '/api/admin/users' 
        : `/api/admin/users?role=${role}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setFilteredUsers(data.users);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    fetchUsersByRole(role);
  };

  // Fetch all attendance records (optionally filtered by date)
  const fetchAttendance = async (date?: string) => {
    setIsAttendanceLoading(true);
    try {
      let url = `/api/admin/attendance?type=${attendanceType}`;
      if (date) url += `&date=${date}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance);
      }
    } catch {
      toast.error('Failed to fetch attendance records');
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // Fetch attendance on mount and when attendanceDate changes
  useEffect(() => {
    fetchAttendance(attendanceDate);
  }, [attendanceDate, attendanceType]);

  // Export attendance to Excel
  const exportAttendanceToExcel = () => {
    const wsData = [
      ['Name', 'Email', 'Date', 'Time', 'Marked By', 'Marked By Email'],
      ...attendance.map(a => [
        a.userId.name,
        a.userId.email,
        a.date,
        new Date(a.timestamp).toLocaleTimeString(),
        a.markedBy?.name || '',
        a.markedBy?.email || ''
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `attendance_${attendanceDate || 'all'}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={{ name: 'Administrator', email: 'admin@system.com', role: 'admin' }} />
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
      <Navbar user={{ name: 'Administrator', email: 'admin@system.com', role: 'admin' }} />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, departments, and system settings</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin/departments/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Department
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={users.length}
            description="All registered users"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Departments"
            value={departments.length}
            description="Active departments"
            icon={Building2}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard
            title="Active Today"
            value="24"
            description="Users marked attendance"
            icon={UserCheck}
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Recent Users</CardTitle>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="coordinator">Coordinators</SelectItem>
                  <SelectItem value="volunteer">Volunteers</SelectItem>
                  <SelectItem value="team-leader">Team Leaders</SelectItem>
                  <SelectItem value="team-member">Team Members</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('-', ' ')}
                      </Badge>
                      {user.role === 'volunteer' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => promoteToCoordinator(user._id)}
                          className="ml-2"
                        >
                          Promote to Coordinator
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No users found for this role
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Departments Overview</CardTitle>
              <CardDescription>
                Department statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departments.map((dept) => (
                  <div key={dept._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-gray-600">
                        {dept.coordinatorIds.length} coordinators, {dept.volunteerIds.length} volunteers
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedDepartment(dept)}>
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Attendance Records
              </div>
              <Select value={attendanceType} onValueChange={(value: 'department' | 'team') => setAttendanceType(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">Department Attendance</SelectItem>
                  <SelectItem value="team">Team Attendance</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
            <CardDescription>
              {attendanceType === 'department' 
                ? 'View coordinator-volunteer attendance records'
                : 'View team leader-member attendance records'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Date</label>
                <input
                  type="date"
                  className="border rounded px-3 py-2"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="ml-auto flex items-center gap-2"
                onClick={exportAttendanceToExcel}
                disabled={attendance.length === 0}
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 border">Name</th>
                    <th className="px-3 py-2 border">Role</th>
                    <th className="px-3 py-2 border">Date</th>
                    <th className="px-3 py-2 border">Time</th>
                    <th className="px-3 py-2 border">Marked By</th>
                    <th className="px-3 py-2 border">
                      {attendanceType === 'department' ? 'Department' : 'Team'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isAttendanceLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        Loading...
                      </td>
                    </tr>
                  ) : attendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendance.map(a => (
                      <tr key={a._id}>
                        <td className="border px-3 py-2">{a.userId.name}</td>
                        <td className="border px-3 py-2">
                          <Badge className={getRoleBadgeColor(a.userId.role)}>
                            {a.userId.role}
                          </Badge>
                        </td>
                        <td className="border px-3 py-2">{a.date}</td>
                        <td className="border px-3 py-2">
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="border px-3 py-2">
                          <div className="space-y-1">
                            <p className="font-medium">{a.markedBy?.name}</p>
                            <Badge className={getRoleBadgeColor(a.markedBy.role)}>
                              {a.markedBy.role.replace('-', ' ')}
                            </Badge>
                            <p className="text-sm text-gray-500">{a.markedBy.email}</p>
                          </div>
                        </td>
                        <td className="border px-3 py-2">
                          {attendanceType === 'department' 
                            ? a.departmentId?.name 
                            : a.teamId?.name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedDepartment && (
          <DepartmentManageDialog
            open={!!selectedDepartment}
            onClose={() => setSelectedDepartment(null)}
            departmentId={selectedDepartment._id}
            departmentName={selectedDepartment.name}
          />
        )}
      </div>
    </div>
  );
}
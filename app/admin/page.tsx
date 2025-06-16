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
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, departmentsRes, pendingRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/departments'),
        fetch('/api/admin/users?status=pending')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (departmentsRes.ok) {
        const deptData = await departmentsRes.json();
        setDepartments(deptData.departments);
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingUsers(pendingData.users);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success('User approved successfully');
        fetchData(); // Refresh data
      } else {
        throw new Error('Failed to approve user');
      }
    } catch (error) {
      toast.error('Failed to approve user');
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
            title="Pending Approvals"
            value={pendingUsers.length}
            description="Team leaders awaiting approval"
            icon={Clock}
            className={pendingUsers.length > 0 ? 'border-orange-200 bg-orange-50' : ''}
          />
          <StatsCard
            title="Active Today"
            value="24"
            description="Users marked attendance"
            icon={UserCheck}
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                Team leaders waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveUser(user._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        <XCircle className="mr-1 h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Latest user registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace('-', ' ')}
                    </Badge>
                  </div>
                ))}
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
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
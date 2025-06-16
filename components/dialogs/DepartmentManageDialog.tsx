import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface DepartmentManageDialogProps {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

export default function DepartmentManageDialog({
  open,
  onClose,
  departmentId,
  departmentName,
}: DepartmentManageDialogProps) {
  const [availableCoordinators, setAvailableCoordinators] = useState<User[]>([]);
  const [availableVolunteers, setAvailableVolunteers] = useState<User[]>([]);
  const [currentCoordinators, setCurrentCoordinators] = useState<User[]>([]);
  const [currentVolunteers, setCurrentVolunteers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, departmentId]);

  const fetchUsers = async () => {
    try {
      const [availCoordsRes, availVolsRes, currentMembersRes] = await Promise.all([
        fetch('/api/admin/users?role=coordinator&unassigned=true'),
        fetch('/api/admin/users?role=volunteer&unassigned=true'),
        fetch(`/api/admin/departments/${departmentId}/members`)
      ]);

      if (availCoordsRes.ok) {
        const data = await availCoordsRes.json();
        setAvailableCoordinators(data.users);
      }

      if (availVolsRes.ok) {
        const data = await availVolsRes.json();
        setAvailableVolunteers(data.users);
      }

      if (currentMembersRes.ok) {
        const data = await currentMembersRes.json();
        setCurrentCoordinators(data.coordinators);
        setCurrentVolunteers(data.volunteers);
      }
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const assignUser = async (userId: string, role: 'coordinator' | 'volunteer') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/departments/${departmentId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });

      if (res.ok) {
        toast.success(`${role} assigned successfully`);
        fetchUsers(); // Refresh lists
      } else {
        throw new Error('Failed to assign user');
      }
    } catch {
      toast.error('Failed to assign user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/departments/${departmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Department deleted successfully');
        onClose();
        // You might want to refresh the departments list in the parent component
        window.location.reload();
      } else {
        throw new Error('Failed to delete department');
      }
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Manage Department - {departmentName}</DialogTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Department
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the department and unassign all its members. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogHeader>

        <Tabs defaultValue="coordinators" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          </TabsList>

          <TabsContent value="coordinators">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Current Coordinators</h3>
                {currentCoordinators.length > 0 ? (
                  <div className="space-y-2">
                    {currentCoordinators.map(coord => (
                      <div key={coord._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{coord.name}</p>
                          <p className="text-sm text-gray-600">{coord.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No coordinators assigned yet</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Available Coordinators</h3>
                <div className="space-y-2">
                  {availableCoordinators.map(coord => (
                    <div key={coord._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{coord.name}</p>
                        <p className="text-sm text-gray-600">{coord.email}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => assignUser(coord._id, 'coordinator')}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="volunteers">
            {/* Similar structure for volunteers */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Current Volunteers</h3>
                {currentVolunteers.length > 0 ? (
                  <div className="space-y-2">
                    {currentVolunteers.map(vol => (
                      <div key={vol._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{vol.name}</p>
                          <p className="text-sm text-gray-600">{vol.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No volunteers assigned yet</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Available Volunteers</h3>
                <div className="space-y-2">
                  {availableVolunteers.map(vol => (
                    <div key={vol._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{vol.name}</p>
                        <p className="text-sm text-gray-600">{vol.email}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => assignUser(vol._id, 'volunteer')}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

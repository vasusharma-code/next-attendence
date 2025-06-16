'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Coordinator {
  _id: string;
  name: string;
  email: string;
}

export default function NewDepartmentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    try {
      const res = await fetch('/api/admin/users?role=coordinator');
      if (res.ok) {
        const data = await res.json();
        setCoordinators(data.users || []);
      }
    } catch {
      toast.error('Failed to load coordinators');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          coordinatorIds: coordinatorId ? [coordinatorId] : [],
        }),
      });
      if (res.ok) {
        toast.success('Department created successfully');
        router.push('/admin');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create department');
      }
    } catch {
      toast.error('Failed to create department');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ name: 'Administrator', email: 'admin@system.com', role: 'admin' }} />
      <div className="max-w-xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Create New Department</CardTitle>
            <CardDescription>
              Enter department details and assign a coordinator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block font-medium mb-1">Department Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g. IT, HR, Operations"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Department description (optional)"
                  rows={3}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Assign Coordinator <span className="text-sm text-gray-500">(optional)</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={coordinatorId}
                  onChange={e => setCoordinatorId(e.target.value)}
                >
                  <option value="">Select coordinator (can be assigned later)</option>
                  {coordinators.map(coor => (
                    <option key={coor._id} value={coor._id}>
                      {coor.name} ({coor.email})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  You can assign or change the coordinator later from the department management page
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Department'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

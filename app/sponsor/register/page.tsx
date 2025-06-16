'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const organizations = ['IIT Delhi', 'IHFC', 'Mathwork', 'Other'];

export default function SponsorRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'confirmPassword' && value) {
          formDataToSend.append(key, value);
        }
      });

      const res = await fetch('/api/auth/sponsor/register', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Registration successful! Please wait for admin approval.');
        router.push('/login');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Sponsor Registration</CardTitle>
          <CardDescription>
            Support the event and showcase your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                required
                placeholder="Enter your full name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a valid email address. This will be used for account verification.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Organization</label>
              <Select
                value={formData.organization}
                onValueChange={value => setFormData(prev => ({ ...prev, organization: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org} value={org}>{org}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                required
                placeholder="Create a password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                minLength={8}
              />
              <p className="text-sm text-gray-500 mt-1">
                Password must be at least 8 characters. Use a mix of letters, numbers, and symbols.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <Input
                type="password"
                required
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

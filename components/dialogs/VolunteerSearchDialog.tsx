import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';

interface Volunteer {
  _id: string;
  name: string;
  email: string;
  hasInvite?: boolean;  // Add this field
}

interface Props {
  open: boolean;
  onClose: () => void;
  departmentId: string;
}

export default function VolunteerSearchDialog({ open, onClose, departmentId }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());

  const searchVolunteers = debounce(async (query: string) => {
    if (!query.trim()) {
      setVolunteers([]);
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/invitations?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data.volunteers);
      }
    } catch (error) {
      toast.error('Failed to search volunteers');
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    const fetchInvitationStatus = async () => {
      try {
        const res = await fetch(`/api/invitations/department/${departmentId}/pending`);
        if (res.ok) {
          const data = await res.json();
          setInvitedUsers(new Set(data.invitations.map((inv: any) => inv.userId)));
        }
      } catch (error) {
        console.error('Error fetching invitation status:', error);
      }
    };

    if (searchQuery) {
      searchVolunteers(searchQuery);
      fetchInvitationStatus();
    }
  }, [searchQuery, departmentId]);

  const sendInvitation = async (userId: string) => {
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, departmentId }),
      });

      if (res.ok) {
        setInvitedUsers(prev => new Set(prev).add(userId));
        toast.success('Invitation sent successfully');
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Volunteer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search volunteers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
              </div>
            ) : volunteers.length > 0 ? (
              <div className="space-y-2">
                {volunteers.map((volunteer) => (
                  <div
                    key={volunteer._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{volunteer.name}</p>
                      <p className="text-sm text-gray-600">{volunteer.email}</p>
                    </div>
                    {invitedUsers.has(volunteer._id) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 cursor-not-allowed"
                        disabled
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Invited
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendInvitation(volunteer._id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-center py-4 text-gray-500">No volunteers found</p>
            ) : (
              <p className="text-center py-4 text-gray-500">
                Search for volunteers by name
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

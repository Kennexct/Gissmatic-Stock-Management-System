import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { UserPlus, Search, Edit, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  accessLevel: 'Manager' | 'Clerk' | 'Viewer';
  status: 'Active' | 'Inactive';
  joinedDate: string;
}

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@stocksys.com',
    accessLevel: 'Manager',
    status: 'Active',
    joinedDate: '2025-01-15'
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah.smith@stocksys.com',
    accessLevel: 'Clerk',
    status: 'Active',
    joinedDate: '2025-08-22'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.j@stocksys.com',
    accessLevel: 'Viewer',
    status: 'Active',
    joinedDate: '2026-01-10'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.d@stocksys.com',
    accessLevel: 'Clerk',
    status: 'Inactive',
    joinedDate: '2024-11-05'
  },
];

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    accessLevel: 'Clerk' as 'Manager' | 'Clerk' | 'Viewer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.accessLevel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newStaff.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!newStaff.email.trim() || !newStaff.email.includes('@')) {
      setError('Valid email is required');
      return;
    }

    // Check for duplicate email
    if (staff.some(s => s.email.toLowerCase() === newStaff.email.toLowerCase())) {
      setError('Email already exists');
      return;
    }

    const staffMember: StaffMember = {
      id: (staff.length + 1).toString(),
      name: newStaff.name,
      email: newStaff.email,
      accessLevel: newStaff.accessLevel,
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setStaff([...staff, staffMember]);
    setSuccess(`Successfully created staff member: ${newStaff.name}`);
    
    // Reset form
    setNewStaff({ name: '', email: '', accessLevel: 'Clerk' });
    
    setTimeout(() => {
      setIsCreateModalOpen(false);
      setSuccess('');
    }, 1500);
  };

  const handleDeleteStaff = (id: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'Manager':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Clerk':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Viewer':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Staff Management</h1>
          <p className="text-slate-400">Manage user accounts and access levels</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-white">{staff.length}</div>
            <p className="text-sm text-slate-400 mt-1">Total Staff</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-white">
              {staff.filter(s => s.status === 'Active').length}
            </div>
            <p className="text-sm text-slate-400 mt-1">Active Users</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-white">
              {staff.filter(s => s.accessLevel === 'Manager').length}
            </div>
            <p className="text-sm text-slate-400 mt-1">Managers</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl text-white">All Staff Members</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 w-full sm:w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Access Level</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Joined Date</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="font-medium text-white">{member.name}</TableCell>
                    <TableCell className="text-slate-300">{member.email}</TableCell>
                    <TableCell>
                      <Badge className={getAccessLevelColor(member.accessLevel)}>
                        {member.accessLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          member.status === 'Active' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{member.joinedDate}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No staff members found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Staff Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Staff Member</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new user to the system with specific access permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Full Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email Address <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessLevel" className="text-slate-200">
                Access Level <span className="text-red-400">*</span>
              </Label>
              <Select
                value={newStaff.accessLevel}
                onValueChange={(value: 'Manager' | 'Clerk' | 'Viewer') =>
                  setNewStaff({ ...newStaff, accessLevel: value })
                }
              >
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="Manager">Manager - Full inventory access</SelectItem>
                  <SelectItem value="Clerk">Clerk - Standard operations</SelectItem>
                  <SelectItem value="Viewer">Viewer - Read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setError('');
                  setSuccess('');
                }}
                className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

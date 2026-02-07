'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - would come from API
const mockUsers = [
  {
    id: '1',
    name: 'Dr. John Doe',
    phone: '9876543210',
    email: 'john@clinic.com',
    role: 'doctor',
    isActive: true,
    branches: ['Main Branch'],
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '9876543211',
    email: 'jane@clinic.com',
    role: 'receptionist',
    isActive: true,
    branches: ['Main Branch', 'Downtown Clinic'],
  },
  {
    id: '3',
    name: 'Mike Johnson',
    phone: '9876543212',
    email: 'mike@clinic.com',
    role: 'nurse',
    isActive: false,
    branches: ['Downtown Clinic'],
  },
];

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  branch_admin: 'bg-blue-100 text-blue-700',
  doctor: 'bg-green-100 text-green-700',
  nurse: 'bg-teal-100 text-teal-700',
  receptionist: 'bg-yellow-100 text-yellow-700',
  pharmacist: 'bg-orange-100 text-orange-700',
  lab_tech: 'bg-pink-100 text-pink-700',
  accountant: 'bg-gray-100 text-gray-700',
};

export default function UserManagementPage() {
  const [users] = useState(mockUsers);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage staff members and their access</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>A list of all staff members in your facility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Branches</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p>{user.phone}</p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          roleColors[user.role] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {user.branches.map((branch, i) => (
                          <span key={branch}>
                            {branch}
                            {i < user.branches.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

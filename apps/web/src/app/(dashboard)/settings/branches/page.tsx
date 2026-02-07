'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - would come from API
const mockBranches = [
  {
    id: '1',
    name: 'Main Branch',
    code: 'MAIN',
    address: '123 Main Street',
    city: 'Mumbai',
    phone: '9876543210',
    isActive: true,
  },
  {
    id: '2',
    name: 'Downtown Clinic',
    code: 'DT01',
    address: '456 Downtown Ave',
    city: 'Mumbai',
    phone: '9876543211',
    isActive: true,
  },
];

export default function BranchManagementPage() {
  const [branches] = useState(mockBranches);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">Manage your facility branches</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{branch.name}</CardTitle>
                <CardDescription>{branch.code}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{branch.address}</p>
                <p className="text-muted-foreground">{branch.city}</p>
                <p>{branch.phone}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

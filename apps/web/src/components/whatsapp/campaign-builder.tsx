'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Users,
  Calendar,
  Clock,
  Send,
  Pause,
  Play,
  MoreVertical,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock campaigns data
const MOCK_CAMPAIGNS = [
  {
    id: 'camp-001',
    name: 'Annual Health Checkup Reminder',
    status: 'active',
    type: 'recurring',
    template: 'health_checkup_reminder',
    audience: 'Patients with last visit > 1 year',
    audienceCount: 234,
    sentCount: 156,
    deliveredCount: 152,
    readCount: 89,
    responseCount: 23,
    scheduledTime: '10:00 AM',
    scheduledDays: ['Mon', 'Wed', 'Fri'],
    createdAt: '2026-01-15',
  },
  {
    id: 'camp-002',
    name: 'Birthday Greetings',
    status: 'active',
    type: 'trigger',
    template: 'birthday_greeting',
    audience: 'All patients (on birthday)',
    audienceCount: 1250,
    sentCount: 45,
    deliveredCount: 45,
    readCount: 38,
    responseCount: 12,
    scheduledTime: '9:00 AM',
    scheduledDays: ['Daily'],
    createdAt: '2026-01-01',
  },
  {
    id: 'camp-003',
    name: 'Diabetes Awareness Week',
    status: 'completed',
    type: 'one-time',
    template: 'health_checkup_reminder',
    audience: 'Diabetic patients',
    audienceCount: 89,
    sentCount: 89,
    deliveredCount: 87,
    readCount: 72,
    responseCount: 15,
    scheduledTime: '11:00 AM',
    scheduledDays: ['14 Nov 2025'],
    createdAt: '2025-11-10',
  },
  {
    id: 'camp-004',
    name: 'Follow-up Reminders',
    status: 'paused',
    type: 'trigger',
    template: 'follow_up_reminder',
    audience: 'Patients with pending follow-ups',
    audienceCount: 67,
    sentCount: 34,
    deliveredCount: 33,
    readCount: 28,
    responseCount: 19,
    scheduledTime: '4:00 PM',
    scheduledDays: ['Daily'],
    createdAt: '2026-01-20',
  },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: Play },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', icon: Pause },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  draft: { label: 'Draft', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
};

export function CampaignBuilder() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Automated patient engagement campaigns</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: '2', icon: Play, color: 'text-green-600' },
          {
            label: 'Messages Sent (This Month)',
            value: '1,234',
            icon: Send,
            color: 'text-blue-600',
          },
          { label: 'Avg. Read Rate', value: '78%', icon: TrendingUp, color: 'text-purple-600' },
          { label: 'Response Rate', value: '23%', icon: Target, color: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={cn('h-8 w-8', stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {MOCK_CAMPAIGNS.map((campaign) => {
          const statusConfig = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG];
          const deliveryRate = Math.round((campaign.deliveredCount / campaign.sentCount) * 100);
          const readRate = Math.round((campaign.readCount / campaign.deliveredCount) * 100);
          const responseRate = Math.round((campaign.responseCount / campaign.readCount) * 100);

          return (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  {/* Campaign Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs rounded-full flex items-center gap-1',
                          statusConfig.color
                        )}
                      >
                        <statusConfig.icon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {campaign.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {campaign.audience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {campaign.scheduledTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {campaign.scheduledDays.join(', ')}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${deliveryRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {campaign.deliveredCount}/{campaign.sentCount} delivered ({deliveryRate}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${readRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{readRate}% read</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${responseRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {responseRate}% responded
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {campaign.status === 'active' && (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Create New Campaign</h3>
              <p className="text-sm text-muted-foreground">
                Set up an automated messaging campaign
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input placeholder="e.g., Monthly Health Tips" />
              </div>

              {/* Campaign Type */}
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'one-time', label: 'One-time', desc: 'Send once to selected audience' },
                    { id: 'recurring', label: 'Recurring', desc: 'Send on a schedule' },
                    { id: 'trigger', label: 'Trigger-based', desc: 'Send on specific events' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      className="p-3 border rounded-lg text-left hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Message Template</Label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Select a template...</option>
                  <option value="health_checkup_reminder">Health Checkup Reminder</option>
                  <option value="birthday_greeting">Birthday Greeting</option>
                  <option value="follow_up_reminder">Follow-up Reminder</option>
                  <option value="prescription_reminder">Prescription Reminder</option>
                </select>
              </div>

              {/* Audience Selection */}
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Audience Filters</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Last Visit</Label>
                      <select className="w-full p-2 border rounded-lg text-sm">
                        <option value="">Any time</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                        <option value="365+">More than a year ago</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Condition</Label>
                      <select className="w-full p-2 border rounded-lg text-sm">
                        <option value="">Any</option>
                        <option value="diabetes">Diabetes</option>
                        <option value="hypertension">Hypertension</option>
                        <option value="thyroid">Thyroid</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Estimated audience</span>
                    <span className="font-semibold text-green-600">~234 patients</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <Label>Schedule</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Send Time</Label>
                    <Input type="time" defaultValue="10:00" />
                  </div>
                  <div>
                    <Label className="text-xs">Days</Label>
                    <div className="flex gap-1">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <button
                          key={i}
                          className={cn(
                            'w-8 h-8 rounded-full text-xs font-medium transition-colors',
                            i < 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

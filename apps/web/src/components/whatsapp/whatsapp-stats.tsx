'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Send,
  CheckCheck,
  Eye,
  MessageCircle,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock analytics data
const STATS = {
  messagesSent: { value: 2847, change: 12.5, trend: 'up' },
  delivered: { value: 2789, change: 8.3, trend: 'up' },
  read: { value: 2156, change: 15.2, trend: 'up' },
  responses: { value: 634, change: -3.1, trend: 'down' },
};

const DAILY_DATA = [
  { day: 'Mon', sent: 420, delivered: 412, read: 318, responses: 89 },
  { day: 'Tue', sent: 385, delivered: 378, read: 295, responses: 76 },
  { day: 'Wed', sent: 456, delivered: 448, read: 352, responses: 98 },
  { day: 'Thu', sent: 398, delivered: 390, read: 301, responses: 82 },
  { day: 'Fri', sent: 512, delivered: 502, read: 398, responses: 112 },
  { day: 'Sat', sent: 345, delivered: 338, read: 265, responses: 71 },
  { day: 'Sun', sent: 331, delivered: 321, read: 227, responses: 56 },
];

const TEMPLATE_PERFORMANCE = [
  { name: 'Appointment Confirmation', sent: 856, readRate: 89, responseRate: 34 },
  { name: 'Reminder (24h)', sent: 723, readRate: 82, responseRate: 45 },
  { name: 'Lab Results Ready', sent: 412, readRate: 91, responseRate: 28 },
  { name: 'Follow-up Reminder', sent: 389, readRate: 76, responseRate: 52 },
  { name: 'Birthday Greeting', sent: 234, readRate: 94, responseRate: 18 },
];

const BOT_STATS = {
  totalConversations: 1234,
  completedBookings: 456,
  handoffToHuman: 89,
  avgResponseTime: '< 1 sec',
};

export function WhatsAppStats() {
  const [dateRange, setDateRange] = useState('7d');
  const maxSent = Math.max(...DAILY_DATA.map((d) => d.sent));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">WhatsApp messaging performance</p>
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                dateRange === range
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-muted-foreground hover:bg-gray-100'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'messagesSent', label: 'Messages Sent', icon: Send, color: 'text-blue-600' },
          { key: 'delivered', label: 'Delivered', icon: CheckCheck, color: 'text-green-600' },
          { key: 'read', label: 'Read', icon: Eye, color: 'text-purple-600' },
          { key: 'responses', label: 'Responses', icon: MessageCircle, color: 'text-amber-600' },
        ].map((stat) => {
          const data = STATS[stat.key as keyof typeof STATS];
          return (
            <Card key={stat.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                  <div
                    className={cn(
                      'flex items-center text-xs',
                      data.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {data.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(data.change)}%
                  </div>
                </div>
                <p className="text-2xl font-bold">{data.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Messages Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Message Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {DAILY_DATA.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${(day.sent / maxSent) * 120}px` }}
                    />
                    <div
                      className="w-full bg-green-500 transition-all"
                      style={{ height: `${(day.read / maxSent) * 120}px` }}
                    />
                    <div
                      className="w-full bg-purple-500 rounded-b transition-all"
                      style={{ height: `${(day.responses / maxSent) * 120}px` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-xs text-muted-foreground">Sent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-xs text-muted-foreground">Read</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-xs text-muted-foreground">Responses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chatbot Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium">Chatbot Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{BOT_STATS.totalConversations}</p>
                <p className="text-xs text-muted-foreground">Total Conversations</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{BOT_STATS.completedBookings}</p>
                <p className="text-xs text-muted-foreground">Bookings Completed</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{BOT_STATS.handoffToHuman}</p>
                <p className="text-xs text-muted-foreground">Handoff to Human</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{BOT_STATS.avgResponseTime}</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bot Resolution Rate</span>
                <span className="font-semibold text-green-600">92.8%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '92.8%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Template Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TEMPLATE_PERFORMANCE.map((template, index) => (
              <div key={template.name} className="flex items-center gap-4">
                <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground">{template.sent} sent</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">Read Rate</span>
                        <span className="font-medium">{template.readRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${template.readRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">Response Rate</span>
                        <span className="font-medium">{template.responseRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${template.responseRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

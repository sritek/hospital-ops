'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, CheckCheck, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock chat data
const MOCK_CHATS = [
  {
    id: 'chat-booking',
    patientName: 'Priya Sharma',
    patientPhone: '+91 98765 43210',
    lastMessage: 'Thank you! I have booked the appointment.',
    lastMessageTime: '10:30 AM',
    unreadCount: 0,
    isBot: true,
    status: 'read',
    type: 'booking',
  },
  {
    id: 'chat-reminder',
    patientName: 'Amit Verma',
    patientPhone: '+91 98765 00001',
    lastMessage: 'Yes, I will be there. Thank you for the reminder.',
    lastMessageTime: '9:45 AM',
    unreadCount: 0,
    isBot: false,
    status: 'read',
    type: 'reminder',
  },
  {
    id: 'chat-results',
    patientName: 'Rajesh Kumar',
    patientPhone: '+91 98765 11111',
    lastMessage: 'Can I get a copy of my lab results?',
    lastMessageTime: '9:15 AM',
    unreadCount: 1,
    isBot: false,
    status: 'delivered',
    type: 'inquiry',
  },
  {
    id: 'chat-reschedule',
    patientName: 'Sneha Reddy',
    patientPhone: '+91 98765 00007',
    lastMessage: 'I need to reschedule my appointment',
    lastMessageTime: 'Yesterday',
    unreadCount: 2,
    isBot: true,
    status: 'delivered',
    type: 'booking',
  },
  {
    id: 'chat-followup',
    patientName: 'Kamla Devi',
    patientPhone: '+91 98765 00013',
    lastMessage: 'Your follow-up is scheduled for tomorrow at 11:00 AM',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isBot: false,
    status: 'read',
    type: 'reminder',
  },
];

interface ChatListProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'bot'>('all');

  const filteredChats = MOCK_CHATS.filter((chat) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!chat.patientName.toLowerCase().includes(query) && !chat.patientPhone.includes(query)) {
        return false;
      }
    }

    // Type filter
    if (filter === 'unread' && chat.unreadCount === 0) return false;
    if (filter === 'bot' && !chat.isBot) return false;

    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 p-2 border-b">
        {[
          { id: 'all' as const, label: 'All' },
          { id: 'unread' as const, label: 'Unread' },
          { id: 'bot' as const, label: 'Bot' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1 text-xs rounded-full transition-colors',
              filter === f.id
                ? 'bg-green-100 text-green-700'
                : 'text-muted-foreground hover:bg-gray-100'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              'w-full p-3 text-left border-b hover:bg-gray-50 transition-colors',
              selectedChatId === chat.id && 'bg-green-50 border-l-2 border-l-green-500'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {chat.patientName.charAt(0)}
                  </span>
                </div>
                {chat.isBot && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{chat.patientName}</p>
                  <span className="text-xs text-muted-foreground">{chat.lastMessageTime}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-muted-foreground truncate pr-2">{chat.lastMessage}</p>
                  <div className="flex items-center gap-1">
                    {chat.status === 'read' && <CheckCheck className="h-3.5 w-3.5 text-blue-500" />}
                    {chat.status === 'delivered' && (
                      <CheckCheck className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, FileText, BarChart3, Plus, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import WhatsApp components
import { ChatList } from '@/components/whatsapp/chat-list';
import { ChatWindow } from '@/components/whatsapp/chat-window';
import { TemplateGallery } from '@/components/whatsapp/template-gallery';
import { CampaignBuilder } from '@/components/whatsapp/campaign-builder';
import { WhatsAppStats } from '@/components/whatsapp/whatsapp-stats';

type TabType = 'chats' | 'templates' | 'campaigns' | 'analytics';

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>('chat-booking');

  const tabs = [
    { id: 'chats' as const, label: 'Conversations', icon: MessageCircle, badge: 3 },
    { id: 'templates' as const, label: 'Templates', icon: FileText },
    { id: 'campaigns' as const, label: 'Campaigns', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">WhatsApp Hub</h1>
            <p className="text-sm text-muted-foreground">Manage patient communications</p>
          </div>
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Connected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            Chatbot Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chats' && (
          <div className="flex h-full">
            {/* Chat List */}
            <div className="w-80 border-r bg-white overflow-y-auto">
              <ChatList selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
            </div>
            {/* Chat Window */}
            <div className="flex-1">
              {selectedChatId ? (
                <ChatWindow chatId={selectedChatId} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a conversation to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-6 overflow-y-auto h-full">
            <TemplateGallery />
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="p-6 overflow-y-auto h-full">
            <CampaignBuilder />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6 overflow-y-auto h-full">
            <WhatsAppStats />
          </div>
        )}
      </div>
    </div>
  );
}

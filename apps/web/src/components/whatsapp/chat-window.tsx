'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Phone, MoreVertical, Bot, CheckCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  mockBookingConversation,
  mockReminderConversation,
  mockLabResultConversation,
} from '@/lib/mock-data';

interface Message {
  id: string;
  sender: 'patient' | 'clinic' | 'bot';
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

// Chat data mapping
const CHAT_DATA: Record<string, { patient: { name: string; phone: string }; messages: Message[] }> =
  {
    'chat-booking': {
      patient: { name: 'Priya Sharma', phone: '+91 98765 43210' },
      messages: mockBookingConversation,
    },
    'chat-reminder': {
      patient: { name: 'Amit Verma', phone: '+91 98765 00001' },
      messages: mockReminderConversation,
    },
    'chat-results': {
      patient: { name: 'Rajesh Kumar', phone: '+91 98765 11111' },
      messages: mockLabResultConversation,
    },
    'chat-reschedule': {
      patient: { name: 'Sneha Reddy', phone: '+91 98765 00007' },
      messages: [
        {
          id: 'msg-1',
          sender: 'patient',
          content: 'Hi, I need to reschedule my appointment for tomorrow',
          timestamp: 'Yesterday, 4:30 PM',
          status: 'read',
        },
        {
          id: 'msg-2',
          sender: 'bot',
          content:
            '👋 Hello Sneha! I can help you reschedule your appointment.\n\nYour current appointment:\n📅 Tomorrow, 10:00 AM\n👨‍⚕️ Dr. Priya Sharma\n\nWould you like to:\n1️⃣ Reschedule to another date\n2️⃣ Cancel the appointment',
          timestamp: 'Yesterday, 4:30 PM',
          status: 'delivered',
        },
        {
          id: 'msg-3',
          sender: 'patient',
          content: '1',
          timestamp: 'Yesterday, 4:32 PM',
          status: 'read',
        },
        {
          id: 'msg-4',
          sender: 'bot',
          content:
            'Great! Here are the available slots for the next 7 days:\n\n📅 *Friday, 9 Feb*\n• 10:00 AM\n• 11:30 AM\n• 4:00 PM\n\n📅 *Saturday, 10 Feb*\n• 9:00 AM\n• 10:30 AM\n\nPlease reply with your preferred date and time.',
          timestamp: 'Yesterday, 4:32 PM',
          status: 'delivered',
        },
      ],
    },
    'chat-followup': {
      patient: { name: 'Kamla Devi', phone: '+91 98765 00013' },
      messages: [
        {
          id: 'msg-1',
          sender: 'clinic',
          content:
            '🏥 *HealthFirst Clinic*\n\nDear Kamla Devi,\n\nThis is a reminder for your follow-up appointment:\n\n📅 Tomorrow, 11:00 AM\n👨‍⚕️ Dr. Priya Sharma\n📍 Main Branch, Sector 22\n\nPlease bring your previous prescription and any recent test reports.\n\nReply YES to confirm or RESCHEDULE to change.',
          timestamp: 'Yesterday, 10:00 AM',
          status: 'read',
        },
        {
          id: 'msg-2',
          sender: 'patient',
          content: 'YES',
          timestamp: 'Yesterday, 10:15 AM',
          status: 'read',
        },
        {
          id: 'msg-3',
          sender: 'clinic',
          content:
            '✅ Thank you for confirming!\n\nYour appointment is confirmed for tomorrow at 11:00 AM.\n\nWe look forward to seeing you.\n\n- HealthFirst Clinic',
          timestamp: 'Yesterday, 10:15 AM',
          status: 'read',
        },
      ],
    },
  };

interface ChatWindowProps {
  chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatData = CHAT_DATA[chatId];

  useEffect(() => {
    if (chatData) {
      setMessages(chatData.messages);
    }
  }, [chatId, chatData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'clinic',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botResponse: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        content: 'Thank you for your message. Our team will get back to you shortly. 🙏',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1500);
  };

  if (!chatData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Chat not found
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#e5ddd5]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-medium">{chatData.patient.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium">{chatData.patient.name}</p>
            <p className="text-xs text-green-200">{chatData.patient.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Date separator */}
        <div className="flex justify-center">
          <span className="px-3 py-1 bg-white/80 rounded-lg text-xs text-gray-500 shadow-sm">
            Today
          </span>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex', message.sender === 'patient' ? 'justify-start' : 'justify-end')}
          >
            <div
              className={cn(
                'max-w-[70%] rounded-lg px-3 py-2 shadow-sm',
                message.sender === 'patient'
                  ? 'bg-white rounded-tl-none'
                  : message.sender === 'bot'
                    ? 'bg-[#dcf8c6] rounded-tr-none'
                    : 'bg-[#dcf8c6] rounded-tr-none'
              )}
            >
              {/* Bot indicator */}
              {message.sender === 'bot' && (
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="h-3 w-3 text-green-600" />
                  <span className="text-[10px] text-green-600 font-medium">AI Assistant</span>
                </div>
              )}

              {/* Message content */}
              <p className="text-sm whitespace-pre-line">{message.content}</p>

              {/* Timestamp and status */}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500">{message.timestamp}</span>
                {message.sender !== 'patient' && (
                  <>
                    {message.status === 'read' && (
                      <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    {message.status === 'delivered' && (
                      <CheckCheck className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    {message.status === 'sent' && <Clock className="h-3 w-3 text-gray-400" />}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-end">
            <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#f0f0f0]">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-white"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-[#075e54] hover:bg-[#064e46]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Copy,
  Eye,
  Edit,
  Calendar,
  Bell,
  FlaskConical,
  Megaphone,
  MessageSquare,
  CheckCircle,
  Globe,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockWhatsAppTemplates, type WhatsAppTemplate } from '@/lib/mock-data';

const CATEGORY_CONFIG = {
  appointments: { label: 'Appointments', icon: Calendar, color: 'bg-blue-100 text-blue-700' },
  reminders: { label: 'Reminders', icon: Bell, color: 'bg-amber-100 text-amber-700' },
  results: { label: 'Results', icon: FlaskConical, color: 'bg-purple-100 text-purple-700' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'bg-pink-100 text-pink-700' },
  general: { label: 'General', icon: MessageSquare, color: 'bg-gray-100 text-gray-700' },
};

export function TemplateGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);

  const filteredTemplates = mockWhatsAppTemplates.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !template.name.toLowerCase().includes(query) &&
        !template.contentEn.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }
    return template.isActive;
  });

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Message Templates</h2>
          <p className="text-sm text-muted-foreground">Pre-approved WhatsApp Business templates</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage('en')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                language === 'en' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5',
                language === 'hi' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'
              )}
            >
              <Languages className="h-3.5 w-3.5" />
              हिंदी
            </button>
          </div>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-full transition-colors',
              !selectedCategory
                ? 'bg-green-100 text-green-700 font-medium'
                : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
            )}
          >
            All
          </button>
          {categories.map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5',
                selectedCategory === key
                  ? config.color + ' font-medium'
                  : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
              )}
            >
              <config.icon className="h-3.5 w-3.5" />
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const categoryConfig = CATEGORY_CONFIG[template.category];
          const content = language === 'hi' ? template.contentHi : template.contentEn;

          return (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setPreviewTemplate(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-md', categoryConfig.color)}>
                      <categoryConfig.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {template.name.replace(/_/g, ' ')}
                      </CardTitle>
                      <span
                        className={cn('text-xs px-2 py-0.5 rounded-full', categoryConfig.color)}
                      >
                        {categoryConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Approved</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Preview */}
                <div className="bg-[#e5ddd5] rounded-lg p-3 mb-3">
                  <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-2 text-xs whitespace-pre-line line-clamp-4">
                    {content}
                  </div>
                </div>

                {/* Variables */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.variables.slice(0, 3).map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      +{template.variables.length - 3} more
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{previewTemplate.name.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-muted-foreground">Template Preview</p>
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('en')}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    language === 'en' ? 'bg-white shadow-sm' : ''
                  )}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    language === 'hi' ? 'bg-white shadow-sm' : ''
                  )}
                >
                  हि
                </button>
              </div>
            </div>

            {/* WhatsApp Preview */}
            <div
              className="p-4 bg-[#e5ddd5]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-3 shadow-sm">
                <p className="text-sm whitespace-pre-line">
                  {language === 'hi' ? previewTemplate.contentHi : previewTemplate.contentEn}
                </p>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <span className="text-[10px] text-gray-500">10:30 AM</span>
                  <CheckCircle className="h-3 w-3 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Variables */}
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Variables used:</p>
              <div className="flex flex-wrap gap-1">
                {previewTemplate.variables.map((variable) => (
                  <span
                    key={variable}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700">Use Template</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

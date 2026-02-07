'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Calendar,
  Stethoscope,
  MessageCircle,
  BarChart3,
  Pill,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/lib/mock-data/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  badge?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Patients', href: '/patients', icon: Users },
  {
    name: 'Consultation',
    href: '/consultation',
    icon: Stethoscope,
    roles: ['doctor'],
  },
  {
    name: 'WhatsApp',
    href: '/whatsapp',
    icon: MessageCircle,
    badge: 'New',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['super_admin', 'branch_admin', 'doctor'],
  },
];

const clinicalNavigation: NavItem[] = [
  {
    name: 'Pharmacy',
    href: '/pharmacy',
    icon: Pill,
    roles: ['super_admin', 'branch_admin', 'pharmacist'],
  },
  {
    name: 'Laboratory',
    href: '/laboratory',
    icon: FlaskConical,
    roles: ['super_admin', 'branch_admin', 'lab_tech'],
  },
];

const settingsNavigation: NavItem[] = [
  {
    name: 'Facility',
    href: '/settings/facility',
    icon: Building2,
    roles: ['super_admin'],
  },
  {
    name: 'Branches',
    href: '/settings/branches',
    icon: Building2,
    roles: ['super_admin', 'branch_admin'],
  },
  {
    name: 'Users',
    href: '/settings/users',
    icon: Users,
    roles: ['super_admin', 'branch_admin'],
  },
  { name: 'Profile', href: '/settings/profile', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.roles) return true;
      return user && item.roles.includes(user.role);
    });
  };

  const filteredNav = filterByRole(navigation);
  const filteredClinical = filterByRole(clinicalNavigation);
  const filteredSettings = filterByRole(settingsNavigation);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <item.icon
          className={cn(
            'mr-3 h-5 w-5 flex-shrink-0',
            isActive ? 'text-primary-foreground' : 'text-gray-400 group-hover:text-gray-500'
          )}
        />
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <span
            className={cn(
              'ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded',
              isActive
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-primary/10 text-primary'
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">HealthFirst</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* Main Navigation */}
          <div className="space-y-1">
            {filteredNav.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>

          {/* Clinical Section */}
          {filteredClinical.length > 0 && (
            <div className="pt-4">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Clinical
              </p>
              <div className="space-y-1">
                {filteredClinical.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Settings Section */}
          {filteredSettings.length > 0 && (
            <div className="pt-4">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </p>
              <div className="space-y-1">
                {filteredSettings.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Info Footer */}
        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

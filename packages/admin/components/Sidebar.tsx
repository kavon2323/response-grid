'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  Truck,
  Package,
  BarChart3,
  Settings,
  Map,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Live Map', href: '/map', icon: Map },
  { name: 'Incidents', href: '/incidents', icon: AlertCircle },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Apparatus', href: '/apparatus', icon: Truck },
  { name: 'Equipment', href: '/equipment', icon: Package },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-fire-700 text-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 bg-fire-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-fire-600 font-bold text-sm">FR</span>
          </div>
          <span className="font-bold text-lg">FireResponse</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${
                  isActive
                    ? 'bg-fire-800 text-white'
                    : 'text-fire-100 hover:bg-fire-600'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Department Info */}
      <div className="p-4 border-t border-fire-600">
        <div className="text-sm">
          <p className="font-medium">Hillside VFD</p>
          <p className="text-fire-200 text-xs">Station 1 - HQ</p>
        </div>
      </div>
    </aside>
  );
}

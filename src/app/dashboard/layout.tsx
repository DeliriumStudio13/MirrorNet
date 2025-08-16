'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { PremiumBadge } from '@/components/ui/premium-badge';
import { Avatar } from '@/components/ui/avatar';
import { NotificationPopup } from '@/components/ui/notification-popup';
import { useNotificationContext } from '@/contexts/notification-context';
import { Settings, Bell } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuthContext();
  const { totalNotifications, markAsViewed } = useNotificationContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
  };

  // Handle auth state
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-[#121214]">
      {/* Navigation */}
      <nav className="bg-[#1a1b1e] border-b border-[#2a2b2e] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
                MirrorNet™
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-[#a1a1aa] hover:text-white hover:bg-[#2a2b2e] focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-2 mr-6">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/search"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard/search')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  Search
                </Link>
                <Link
                  href="/dashboard/notifications"
                  onClick={markAsViewed}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
                    isActive('/dashboard/notifications')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  <Bell className="h-4 w-4 inline mr-1" />
                  Notifications
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/attraction"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard/attraction')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  💖 Attraction
                </Link>
                <Link
                  href="/dashboard/traits-guide"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard/traits-guide')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  Traits Guide
                </Link>
              </nav>
              <div className="flex items-center space-x-4 border-l border-[#2a2b2e] pl-4">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center space-x-3 text-sm text-[#a1a1aa] hover:text-[#e1e1e6] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span>Welcome, {user.firstName}</span>
                    {user.isPremium && <PremiumBadge size="sm" />}
                  </div>
                  <Avatar
                    src={user.avatarUrl}
                    alt={`${user.firstName}'s profile`}
                    size={32}
                    className="border-2 border-transparent group-hover:border-[#3b82f6] transition-colors"
                  />
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="p-2 text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e] rounded-md transition-colors"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                {!user.isPremium && (
                  <Link
                    href="/dashboard/premium"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                  >
                    Go Premium
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-[#e1e1e6] bg-[#2a2b2e] rounded-md hover:bg-[#3b3b3e] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1b1e] focus:ring-[#3b82f6]"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-[#2a2b2e] py-3">
              <div className="flex flex-col space-y-1 mb-4">
                <Link
                  href="/dashboard"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/search"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive('/dashboard/search')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  Search
                </Link>
                <Link
                  href="/dashboard/notifications"
                  onClick={markAsViewed}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    isActive('/dashboard/notifications')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  <Bell className="h-4 w-4 inline mr-1" />
                  Notifications
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/attraction"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive('/dashboard/attraction')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  💖 Attraction
                </Link>
                <Link
                  href="/dashboard/traits-guide"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive('/dashboard/traits-guide')
                      ? 'bg-[#2a2b2e] text-[#e1e1e6]'
                      : 'text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e]'
                  }`}
                >
                  Traits Guide
                </Link>
              </div>
              <div className="border-t border-[#2a2b2e] pt-3 space-y-3">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e] transition-colors"
                >
                  <Avatar
                    src={user.avatarUrl}
                    alt={`${user.firstName}'s profile`}
                    size={32}
                    className="border-2 border-[#2a2b2e]"
                  />
                  <div className="flex items-center gap-2">
                    <span>Welcome, {user.firstName}</span>
                    {user.isPremium && <PremiumBadge size="sm" />}
                  </div>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-[#a1a1aa] hover:text-[#e1e1e6] hover:bg-[#2a2b2e] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                {!user.isPremium && (
                  <Link
                    href="/dashboard/premium"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 mx-4 rounded-lg"
                  >
                    <span>Go Premium</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-[#e1e1e6] hover:bg-[#2a2b2e] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Notification Popup */}
      <NotificationPopup />
    </div>
  );
}

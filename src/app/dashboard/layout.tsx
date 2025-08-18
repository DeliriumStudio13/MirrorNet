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
import { Settings, Bell, Frame, Search, Home, Heart, BookOpen } from 'lucide-react';


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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Frame className="h-12 w-12 text-purple-500 mr-3" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MirrorNet™
            </span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <Frame className="h-8 w-8 text-purple-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  MirrorNet™
                </span>
              </Link>
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-lg font-medium text-gray-300">
                  Welcome, <span className="text-white">{user.firstName}</span>
                  {user.isPremium && <span className="ml-2"><PremiumBadge size="sm" /></span>}
                </span>
                <Avatar 
                  src={user.avatarUrl || user.profilePicture} 
                  alt={user.firstName} 
                  size="sm" 
                />
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
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
              <nav className="flex items-center space-x-1 mr-6">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/search"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/dashboard/search')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  Search
                </Link>
                <Link
                  href="/dashboard/notifications"
                  onClick={markAsViewed}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive('/dashboard/notifications')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/attraction"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/dashboard/attraction')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  Attraction
                </Link>
                <Link
                  href="/dashboard/traits-guide"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/dashboard/traits-guide')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Guide
                </Link>
              </nav>
              <div className="flex items-center space-x-4 border-l border-gray-700 pl-4">
                <Link
                  href="/dashboard/settings"
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                {!user.isPremium && (
                  <Link
                    href="/dashboard/premium"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Go Premium
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-800 py-3">
              {/* Welcome message for mobile */}
              <div className="px-4 py-2 mb-3 border-b border-gray-800">
                <span className="text-lg font-medium text-gray-300">
                  Welcome, <span className="text-white">{user.firstName}</span>
                  {user.isPremium && <span className="ml-2"><PremiumBadge size="sm" /></span>}
                </span>
              </div>
              <div className="flex flex-col space-y-1 mb-4">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/search"
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive('/dashboard/search')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  Search
                </Link>
                <Link
                  href="/dashboard/notifications"
                  onClick={markAsViewed}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative ${
                    isActive('/dashboard/notifications')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                  {totalNotifications > 0 && (
                    <span className="absolute top-2 left-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/attraction"
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive('/dashboard/attraction')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  Attraction
                </Link>
                <Link
                  href="/dashboard/traits-guide"
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive('/dashboard/traits-guide')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Traits Guide
                </Link>
              </div>
              <div className="border-t border-gray-800 pt-3 space-y-3">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Avatar
                    src={user.avatarUrl}
                    alt={`${user.firstName}'s profile`}
                    size={32}
                    className="border-2 border-gray-700"
                  />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                {!user.isPremium && (
                  <Link
                    href="/dashboard/premium"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 mx-4 rounded-lg transform hover:scale-105"
                  >
                    <span>Go Premium</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
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

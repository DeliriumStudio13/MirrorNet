'use client';

import { useEffect, useState } from 'react';
import { useNotificationContext } from '@/contexts/notification-context';
import { Bell, X } from 'lucide-react';
import Link from 'next/link';

export function NotificationPopup() {
  const { totalNotifications, hasNewNotifications, markAsViewed } = useNotificationContext();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Show popup when there are new notifications
    if (hasNewNotifications && totalNotifications > 0) {
      setShouldShow(true);
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setShouldShow(false), 300); // Wait for animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [hasNewNotifications, totalNotifications]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShouldShow(false), 300);
    markAsViewed();
  };

  const handleClick = () => {
    markAsViewed();
  };

  if (!shouldShow || totalNotifications === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <div className="bg-[#1a1b1e] border border-blue-500/30 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="h-4 w-4 text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white">
              New Notification{totalNotifications > 1 ? 's' : ''}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              You have {totalNotifications} pending notification{totalNotifications > 1 ? 's' : ''}
            </p>
            
            <Link
              href="/dashboard/notifications"
              onClick={handleClick}
              className="inline-block text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
            >
              View all →
            </Link>
          </div>
          
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

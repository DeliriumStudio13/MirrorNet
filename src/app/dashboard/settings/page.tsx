'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Link from 'next/link';
import { Settings, Crown, User, Shield, AlertTriangle, CreditCard, Key, FileText, HelpCircle, ExternalLink, Lock } from 'lucide-react';
import { createPortalSession } from '../premium/actions';
import { PremiumBadge } from '@/components/ui/premium-badge';

export default function SettingsPage() {
  const { user } = useAuthContext();
  const [processing, setProcessing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleTogglePremium = async () => {
    if (!user?.uid) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      if (user.isPremium) {
        // Revert to standard
        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: false,
          premiumSince: null,
          premiumPlan: null,
          premiumExpires: null,
          premiumTokens: 0,
          revertedAt: serverTimestamp()
        });
        setSuccess('Reverted to standard account successfully!');
      } else {
        // Upgrade to premium
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: true,
          premiumSince: serverTimestamp(),
          premiumPlan: 'monthly_trial',
          premiumExpires: trialEndDate,
          premiumTokens: 3,
          upgradedAt: serverTimestamp()
        });
        setSuccess('Upgraded to premium successfully!');
      }
    } catch (err) {
      console.error('Error toggling premium status:', err);
      setError('Failed to update premium status. Please try again.');
    } finally {
      setProcessing(false);
    }
  };



  // Password change functionality
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      
      // Update password
      await updatePassword(auth.currentUser!, passwordForm.newPassword);
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect.');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('New password is too weak. Please choose a stronger password.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('For security, please sign out and sign back in before changing your password.');
      } else {
        setPasswordError('Failed to update password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition-colors block mb-4"
        >
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-gray-400">Manage your account preferences and premium features</p>
      </div>

      {/* Account Information */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Information
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Name:</span>
            <div className="flex items-center gap-2">
              <span className="text-white">{user?.firstName} {user?.lastName}</span>
              {user?.isPremium && <PremiumBadge size="sm" />}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Email:</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm px-2 py-1 rounded-full ${
                user?.isPremium 
                  ? 'bg-purple-600/20 text-purple-300' 
                  : 'bg-gray-600/20 text-gray-300'
              }`}>
                {user?.isPremium ? 'Premium' : 'Standard'}
              </span>
            </div>
          </div>
          {user?.isPremium && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Premium Tokens:</span>
                <span className="text-purple-300 font-medium">{user.premiumTokens}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white">{user.premiumPlan === 'monthly_trial' ? '30-Day Trial' : 'Monthly'}</span>
              </div>
              {user.premiumExpires && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    {user.premiumPlan === 'monthly_trial' ? 'Trial Ends:' : 'Expires:'}
                  </span>
                  <span className="text-white">{user.premiumExpires ? new Date(user.premiumExpires).toLocaleDateString() : 'N/A'}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Password & Security */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-400" />
          Password & Security
        </h2>
        
        <div className="space-y-4">
          {/* Change Password */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Change Password</h3>
                <p className="text-gray-400 text-sm">
                  Update your password to keep your account secure
                </p>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Change Password
              </button>
            </div>
            
            {showPasswordChange && (
              <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 border-t border-gray-700 pt-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-white mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-white mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full h-10 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                    placeholder="Confirm your new password"
                    required
                  />
                </div>
                
                {passwordError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{passwordError}</p>
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm">{passwordSuccess}</p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Premium Controls */}
      {user?.isPremium && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-400" />
            Premium Controls
          </h2>
          
          <div className="space-y-4">
            {/* Subscription Management */}
            <div className="border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Manage Subscription</h3>
                  <p className="text-gray-400 text-sm">
                    Update payment method, view billing history, or cancel subscription
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      setPortalLoading(true);
                      setError(null);
                      await createPortalSession();
                    } catch (err) {
                      console.error('Error opening portal:', err);
                      setError('Failed to open billing portal. Please try again.');
                    } finally {
                      setPortalLoading(false);
                    }
                  }}
                  disabled={portalLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {portalLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Billing Portal
                    </>
                  )}
                </button>
              </div>
            </div>


          </div>
        </div>
      )}

      {/* Support & Help */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-green-400" />
          Support & Help
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/faq"
            className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">FAQ</h3>
                <p className="text-gray-400 text-sm">Frequently asked questions</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </div>
          </Link>
          
          <Link 
            href="/terms"
            className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">Terms of Service</h3>
                <p className="text-gray-400 text-sm">Legal terms and conditions</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </div>
          </Link>
          
          <Link 
            href="/privacy"
            className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">Privacy Policy</h3>
                <p className="text-gray-400 text-sm">How we protect your data</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-400" />
          Privacy & Security
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="text-white font-medium">Anonymous Ratings</div>
              <div className="text-gray-400 text-sm">Your ratings are anonymous by default</div>
            </div>
            <div className="text-green-400 text-sm">✓ Enabled</div>
          </div>
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="text-white font-medium">Data Protection</div>
              <div className="text-gray-400 text-sm">Your personal data is securely encrypted</div>
            </div>
            <div className="text-green-400 text-sm">✓ Protected</div>
          </div>
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="text-white font-medium">Reveal Control</div>
              <div className="text-gray-400 text-sm">You control when to reveal your identity</div>
            </div>
            <div className="text-green-400 text-sm">✓ Your Choice</div>
          </div>
        </div>
      </div>

      {/* Testing Environment Notice */}
      {user?.isPremium && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-300 font-medium mb-1">Testing Environment</h3>
              <p className="text-yellow-200 text-sm">
                Premium controls are for testing purposes only. In production, premium upgrades would be handled through Stripe payment processing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
          <p className="text-green-400">{success}</p>
        </div>
      )}
    </div>
  );
}

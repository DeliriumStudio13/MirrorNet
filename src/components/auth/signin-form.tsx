'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthButton } from './auth-button';

export function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isResetMode) {
        // Handle password reset
        await sendPasswordResetEmail(auth, formData.email);
        setSuccess('If an account with that email exists, we\'ve sent a password reset link to your inbox.');
        setIsResetMode(false);
      } else {
        // Handle sign in
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (isResetMode) {
          // Handle password reset errors
          if (err.code === 'auth/invalid-email') {
            setError('Please enter a valid email address.');
          } else if (err.code === 'auth/too-many-requests') {
            setError('Too many reset attempts. Please wait a moment before trying again.');
          } else {
            setError('Unable to send reset email. Please try again later.');
          }
        } else {
          // Handle sign-in errors with updated Firebase error codes
          if (err.code === 'auth/user-not-found') {
            setError('No account found with this email address.');
          } else if (err.code === 'auth/wrong-password') {
            setError('Incorrect password. Please try again.');
          } else if (err.code === 'auth/invalid-credential') {
            // New Firebase error code for wrong password/email combination
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (err.code === 'auth/invalid-email') {
            setError('Please enter a valid email address.');
          } else if (err.code === 'auth/too-many-requests') {
            setError('Too many failed attempts. Please wait a moment before trying again.');
          } else {
            // For any other error, show a generic message
            console.error('Sign-in error:', err.code, err.message);
            setError('Unable to sign in. Please check your credentials and try again.');
          }
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleResetMode = () => {
    setIsResetMode(!isResetMode);
    setError('');
    setSuccess('');
    setFormData(prev => ({ ...prev, password: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}

      {isResetMode && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
          <p className="text-blue-400 text-sm mb-2">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <p className="text-blue-300 text-xs">
            For security reasons, you'll see a confirmation message regardless of whether the email exists in our system.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full h-12 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm relative z-20"
          placeholder={isResetMode ? "Enter your email to reset password" : "Enter your email"}
          required
        />
      </div>

      {!isResetMode && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-1.5">
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-12 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm relative z-20"
            placeholder="Enter your password"
            required
          />
        </div>
      )}
      
      {/* Forgot Password Link */}
      {!isResetMode && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleResetMode}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm relative z-20"
      >
        {loading 
          ? (isResetMode ? 'Sending reset email...' : 'Signing in...') 
          : (isResetMode ? 'Send reset email' : 'Sign In')
        }
      </button>
      
      {/* Back to sign in link in reset mode */}
      {isResetMode && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={toggleResetMode}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      )}

      {!isResetMode && (
        <>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="relative z-20">
            <AuthButton />
          </div>
        </>
      )}
    </form>
  );
}
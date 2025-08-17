'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [lastNameChange, setLastNameChange] = useState<Timestamp | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName ?? '');
          setLastName(data.lastName ?? '');
          setProfilePicture(data.profilePicture ?? '');
          setLastNameChange(data.lastNameChange ?? null);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      }
    }

    loadProfile();
  }, [user?.uid]);

  const canChangeName = () => {
    if (!lastNameChange) return true;
    
    const lastChange = lastNameChange.toDate();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return lastChange < oneMonthAgo;
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        firstName_lowercase: firstName.trim().toLowerCase(),
        lastName_lowercase: lastName.trim().toLowerCase(),
        lastNameChange: new Date(),
      });

      setIsEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.uid || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Starting upload for user:', user.uid);
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      console.log('Created storage ref:', storageRef.fullPath);
      
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Upload completed:', uploadResult);
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Got download URL:', downloadURL);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePicture: downloadURL,
        avatarUrl: downloadURL, // Update both fields for consistency
      });

      setProfilePicture(downloadURL);
      setSuccess('Profile picture updated successfully');
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      // More detailed error message
      let errorMessage = 'Failed to upload profile picture';
      if (err instanceof Error) {
        if (err.message.includes('storage/unauthorized')) {
          errorMessage = 'Permission denied. Please try again.';
        } else if (err.message.includes('storage/quota-exceeded')) {
          errorMessage = 'Storage quota exceeded. Please contact support.';
        } else if (err.message.includes('storage/canceled')) {
          errorMessage = 'Upload was cancelled. Please try again.';
        } else if (err.message.includes('storage/invalid-argument')) {
          errorMessage = 'Invalid file. Please try another image.';
        }
        console.error('Detailed error:', err.message);
      }
      setError(errorMessage);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#121214]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-[#e1e1e6]">Profile Settings</h1>

        {/* Profile Picture */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            {profilePicture ? (
              <div className="relative w-full h-full">
                <Image
                  src={profilePicture}
                  alt="Profile"
                  fill
                  className="rounded-full object-cover"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    setProfilePicture(''); // Reset to placeholder on error
                    setError('Failed to load profile picture');
                  }}
                />
                {isSaving && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b82f6]"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-[#2a2b2e] flex items-center justify-center text-[#a1a1aa]">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="px-4 py-2 bg-[#2a2b2e] text-[#e1e1e6] rounded-md hover:bg-[#3b3b3e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#121214] disabled:opacity-50"
          >
            {isSaving ? 'Uploading...' : 'Change Profile Picture'}
          </button>
        </div>

        {/* Name Fields */}
        <div className="bg-[#1a1b1e] rounded-xl border border-[#2a2b2e] p-6 shadow-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[#e1e1e6] mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!isEditing || isSaving}
                className="w-full px-4 py-2 bg-[#2a2b2e] border border-[#3b3b3e] rounded-md text-[#e1e1e6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-[#e1e1e6] mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!isEditing || isSaving}
                className="w-full px-4 py-2 bg-[#2a2b2e] border border-[#3b3b3e] rounded-md text-[#e1e1e6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent disabled:opacity-50"
              />
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                disabled={!canChangeName()}
                className="w-full px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#1a1b1e] disabled:opacity-50"
              >
                {canChangeName() ? 'Edit Name' : 'Name can be changed once per month'}
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#1a1b1e] disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFirstName(user.firstName || '');
                    setLastName(user.lastName || '');
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#2a2b2e] text-[#a1a1aa] rounded-md hover:bg-[#3b3b3e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b3b3e] focus:ring-offset-2 focus:ring-offset-[#1a1b1e] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Last name change info */}
          {lastNameChange && (
            <p className="mt-4 text-sm text-[#a1a1aa]">
              Last name change: {lastNameChange.toDate().toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
}

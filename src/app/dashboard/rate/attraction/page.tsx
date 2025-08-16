'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { standardCircles } from '@/lib/traits-library';
import type { AppUser } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Star, Heart, Users, Search, Sparkles } from 'lucide-react';

const MEMBERS_PER_PAGE = 6;

interface AttractionMember extends AppUser {
  fromCircle: string;
  hasRated: boolean;
}

export default function AttractionMemberSelectionPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [allMembers, setAllMembers] = useState<AttractionMember[]>([]);
  const [circleMembers, setCircleMembers] = useState<AttractionMember[]>([]);
  const [anyUserMembers, setAnyUserMembers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [ratedMembers, setRatedMembers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'circles' | 'anyone'>('circles');

  const circle = standardCircles.attraction;

  // Calculate pagination for circle members
  const totalPages = Math.ceil(circleMembers.length / MEMBERS_PER_PAGE);
  const startIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
  const endIndex = startIndex + MEMBERS_PER_PAGE;
  const currentMembers = circleMembers.slice(startIndex, endIndex);

  useEffect(() => {
    async function loadAttractionMembers() {
      setLoading(true);
      setError(null);
      
      try {
        if (!user?.uid) {
          throw new Error('User is not authenticated');
        }

        // Get all circle members where you are the owner (excluding family)
        const membersRef = collection(db, 'userCircles');
        const excludedCircles = ['family']; // Exclude family circle
        const allMembersData: AttractionMember[] = [];

        // Get members from each circle (except family)
        for (const [circleId, circleData] of Object.entries(standardCircles)) {
          if (excludedCircles.includes(circleId)) continue;
          if (circleId === 'attraction') continue; // Don't include attraction circle itself

          const q = query(
            membersRef,
            where('circleId', '==', circleId),
            where('ownerUid', '==', user.uid)
          );
          
          const snapshot = await getDocs(q);
          
          // Get member IDs excluding yourself
          const memberIds = snapshot.docs
            .map(doc => doc.data().memberUid)
            .filter(id => id !== user.uid);

          // Get user details for each member
          for (const memberId of memberIds) {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              allMembersData.push({
                uid: memberId,
                ...userData,
                fromCircle: circleData.name,
                hasRated: false
              } as AttractionMember);
            }
          }
        }

        // Remove duplicates (same person in multiple circles)
        const uniqueMembers = allMembersData.reduce((acc, member) => {
          const existing = acc.find(m => m.uid === member.uid);
          if (!existing) {
            acc.push(member);
          }
          return acc;
        }, [] as AttractionMember[]);

        setAllMembers(uniqueMembers);
        setCircleMembers(uniqueMembers);

        // Check which members have been rated in attraction circle
        const ratingsRef = collection(db, 'ratings');
        const ratingsQuery = query(
          ratingsRef,
          where('raterUid', '==', user.uid),
          where('circleId', '==', 'attraction')
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratedMemberIds = new Set<string>();
        
        ratingsSnapshot.docs.forEach(doc => {
          const ratingData = doc.data();
          ratedMemberIds.add(ratingData.ratedUid);
        });
        
        setRatedMembers(ratedMemberIds);

        // Update hasRated status
        const updatedMembers = uniqueMembers.map(member => ({
          ...member,
          hasRated: ratedMemberIds.has(member.uid)
        }));
        
        setCircleMembers(updatedMembers);
      } catch (err) {
        console.error('Error loading attraction members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setLoading(false);
      }
    }

    loadAttractionMembers();
  }, [user?.uid]);

  const handleSearchAnyUser = async () => {
    if (!searchTerm.trim() || !user) return;
    
    setSearchLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('firstName_lowercase', '>=', searchTerm.toLowerCase()),
        where('firstName_lowercase', '<=', searchTerm.toLowerCase() + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      const searchResults = snapshot.docs
        .map(doc => ({ ...doc.data(), uid: doc.id } as AppUser))
        .filter(result => result.uid !== user.uid);

      setSearchResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMemberSelect = (memberId: string, usesToken: boolean = false) => {
    const params = new URLSearchParams();
    if (usesToken) {
      params.set('token', 'true');
    }
    router.push(`/dashboard/rate/attraction/${memberId}?${params.toString()}`);
  };

  const canUseTokens = user?.isPremium && user?.premiumTokens > 0;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading attraction members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors block mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="h-8 w-8 text-pink-500" />
            Select Member to Rate - Attraction
          </h1>
          <p className="text-gray-400 mt-2">
            Rate members from your circles anonymously (Family circle excluded)
          </p>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.isPremium ? (
              <>
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-medium">Premium User</span>
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 text-pink-400" />
                <span className="text-pink-300 font-medium">Standard User</span>
              </>
            )}
          </div>
          <div className="text-gray-300 text-sm">
            {user?.isPremium ? (
              <>Premium tokens: {user.premiumTokens} • Rate anyone • Send reveal requests</>
            ) : (
              <>Rate circle members anonymously • See rating count only</>
            )}
          </div>
        </div>
        {!user?.isPremium && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-gray-400 text-xs">
              💡 Upgrade to premium to rate anyone in the app and see detailed ratings you receive
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('circles')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'circles'
              ? 'text-pink-400 border-b-2 border-pink-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          From Your Circles ({circleMembers.length})
        </button>
        {user?.isPremium && (
          <button
            onClick={() => setActiveTab('anyone')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'anyone'
                ? 'text-pink-400 border-b-2 border-pink-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="h-4 w-4 inline mr-2" />
            Rate Anyone
          </button>
        )}
        {!user?.isPremium && (
          <div className="px-6 py-3 font-medium text-gray-600 cursor-not-allowed flex items-center">
            <Search className="h-4 w-4 inline mr-2" />
            Rate Anyone (Premium Only)
          </div>
        )}
      </div>

      {/* Circle Members Tab */}
      {activeTab === 'circles' && (
        <>
          {circleMembers.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No members found in your circles</p>
              <p className="text-sm text-gray-500 mt-2">
                Add members to your circles to rate them in Attraction
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentMembers.map(member => {
                  const isRated = member.hasRated;
                  return (
                    <button
                      key={`member_${member.uid}`}
                      onClick={() => handleMemberSelect(member.uid)}
                      className={`rounded-lg p-6 text-left transition-all duration-200 group relative ${
                        isRated 
                          ? 'bg-pink-900/30 border-2 border-pink-500/50 hover:bg-pink-900/40' 
                          : 'bg-gray-800 border-2 border-transparent hover:bg-gray-700 hover:border-pink-500/30'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                          {member.avatarUrl ? (
                            <Image
                              src={member.avatarUrl}
                              alt={`${member.firstName}'s profile`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className={`text-xl font-semibold transition-colors ${
                              isRated 
                                ? 'text-pink-400 group-hover:text-pink-300' 
                                : 'text-white group-hover:text-pink-400'
                            }`}>
                              {member.firstName} {member.lastName}
                            </h2>
                            {isRated && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-5 w-5 text-pink-400" />
                                <Heart className="h-4 w-4 text-pink-400 fill-current" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-1">
                            From {member.fromCircle}
                          </p>
                          <p className={`text-sm transition-colors ${
                            isRated 
                              ? 'text-pink-300 group-hover:text-pink-200' 
                              : 'text-gray-400 group-hover:text-gray-300'
                          }`}>
                            {isRated ? 'Already rated - Click to update rating' : 'Click to rate anonymously'}
                          </p>
                        </div>
                      </div>
                      
                      {isRated && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Rated
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Rate Anyone Tab */}
      {activeTab === 'anyone' && (
        <div className="space-y-6">
          {!user?.isPremium ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg">
              <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Premium Feature</h3>
              <p className="text-gray-400 mb-4">
                Upgrade to premium to rate anyone in the app
              </p>
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Upgrade to Premium
              </button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAnyUser()}
                  placeholder="Search by name..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={handleSearchAnyUser}
                  disabled={searchLoading || !canUseTokens}
                  className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Token Warning */}
              {!canUseTokens && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ You need premium tokens to rate users outside your circles. You have {user.premiumTokens} tokens remaining.
                  </p>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Search Results (Uses 1 token per rating)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map(result => (
                      <button
                        key={`search_${result.uid}`}
                        onClick={() => handleMemberSelect(result.uid, true)}
                        disabled={!canUseTokens}
                        className="rounded-lg p-6 text-left bg-gray-800 border-2 border-transparent hover:bg-gray-700 hover:border-pink-500/30 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                            {result.avatarUrl ? (
                              <Image
                                src={result.avatarUrl}
                                alt={`${result.firstName}'s profile`}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-semibold text-white group-hover:text-pink-400 transition-colors">
                              {result.firstName} {result.lastName}
                            </h2>
                            <p className="text-sm text-gray-400 mb-1">
                              {result.email}
                            </p>
                            <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                              Uses 1 premium token
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

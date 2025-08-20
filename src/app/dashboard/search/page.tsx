'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, writeBatch, limit, startAfter, orderBy } from 'firebase/firestore';
import { standardCircles } from '@/lib/traits-library';
import type { AppUser } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { PremiumBadge } from '@/components/ui/premium-badge';
import { Avatar } from '@/components/ui/avatar';

interface SearchResult extends AppUser {
  existingInvites?: Set<string>;
}

interface SuggestedUser extends AppUser {
  mutualMember: {
    name: string;
    circle: string;
  };
  existingInvites?: Set<string>;
}

const RESULTS_PER_PAGE = 5;
const PREVIEW_RESULTS_LIMIT = 3;

export default function SearchPage() {
  const { user } = useAuthContext();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const preselectedCircle = searchParams.get('circle');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [previewResults, setPreviewResults] = useState<SearchResult[]>([]);
  const [selectedCircles, setSelectedCircles] = useState<Record<string, Set<string>>>(() => {
    // Initialize with preselected circle if provided
    if (preselectedCircle) {
      const circles: Record<string, Set<string>> = {};
      circles[preselectedCircle] = new Set();
      return circles;
    }
    return {};
  });
  const [inviting, setInviting] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [currentSuggestedIndex, setCurrentSuggestedIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch suggested users from your circle members' circles
  useEffect(() => {
    async function fetchSuggestedUsers() {
      if (!user?.uid) return;

      try {
        // Get all your circle memberships
        const membersRef = collection(db, 'userCircles');
        const yourCirclesQuery = query(
          membersRef,
          where('ownerUid', '==', user.uid)
        );
        
        const yourCirclesSnapshot = await getDocs(yourCirclesQuery);
        const yourMembers = yourCirclesSnapshot.docs.map(doc => ({
          memberId: doc.data().memberUid,
          circleId: doc.data().circleId
        }));

        // For each member, get their circle members
        const suggestedUsersMap = new Map<string, SuggestedUser>(); // Use map to deduplicate

        for (const { memberId, circleId } of yourMembers) {
          if (memberId === user.uid) continue; // Skip yourself

          // Get the member's name
          const memberDoc = await getDoc(doc(db, 'users', memberId));
          if (!memberDoc.exists()) continue;
          const memberData = memberDoc.data();
          const memberName = `${memberData.firstName} ${memberData.lastName}`;

          // Get their circle members
          const theirCircleQuery = query(
            membersRef,
            where('ownerUid', '==', memberId),
            where('circleId', '==', circleId)
          );

          const theirMembersSnapshot = await getDocs(theirCircleQuery);
          
          for (const memberDoc of theirMembersSnapshot.docs) {
            const suggestedUserId = memberDoc.data().memberUid;
            
            // Skip if it's you or if it's someone you're already connected with
            if (suggestedUserId === user.uid || yourMembers.some(m => m.memberId === suggestedUserId)) {
              continue;
            }

            // Get user details if we haven't seen them before
            if (!suggestedUsersMap.has(suggestedUserId)) {
              const userDoc = await getDoc(doc(db, 'users', suggestedUserId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                suggestedUsersMap.set(suggestedUserId, {
                  ...userData,
                  uid: suggestedUserId,
                  mutualMember: {
                    name: memberName,
                    circle: standardCircles[circleId]?.name || circleId
                  }
                });
              }
            }
          }
        }

        const suggestedUsersArray = Array.from(suggestedUsersMap.values());
        setSuggestedUsers(suggestedUsersArray);
        
        // Load existing invites for suggested users
        await loadExistingInvites(suggestedUsersArray);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      }
    }

    fetchSuggestedUsers();
  }, [user?.uid]);

  // Live search for preview results - searches both first name AND last name
  const performLiveSearch = useCallback(async (term: string) => {
    if (!term.trim() || !user) {
      setPreviewResults([]);
      setShowPreview(false);
      return;
    }
    
    setPreviewLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const lowerTerm = term.toLowerCase();
      
      // Query 1: Search by first name
      const firstNameQuery = query(
        usersRef,
        where('firstName_lowercase', '>=', lowerTerm),
        where('firstName_lowercase', '<=', lowerTerm + '\uf8ff'),
        orderBy('firstName_lowercase'),
        limit(PREVIEW_RESULTS_LIMIT)
      );
      
      // Query 2: Search by last name
      const lastNameQuery = query(
        usersRef,
        where('lastName_lowercase', '>=', lowerTerm),
        where('lastName_lowercase', '<=', lowerTerm + '\uf8ff'),
        orderBy('lastName_lowercase'),
        limit(PREVIEW_RESULTS_LIMIT)
      );
      
      // Execute both queries
      const [firstNameSnapshot, lastNameSnapshot] = await Promise.all([
        getDocs(firstNameQuery),
        getDocs(lastNameQuery)
      ]);
      
      // Combine results and remove duplicates
      const resultsMap = new Map<string, SearchResult>();
      
      // Add first name results
      firstNameSnapshot.docs.forEach(doc => {
        if (doc.id !== user.uid) {
          resultsMap.set(doc.id, { ...doc.data(), uid: doc.id } as SearchResult);
        }
      });
      
      // Add last name results (will overwrite duplicates, which is fine)
      lastNameSnapshot.docs.forEach(doc => {
        if (doc.id !== user.uid) {
          resultsMap.set(doc.id, { ...doc.data(), uid: doc.id } as SearchResult);
        }
      });
      
      // Convert to array and sort alphabetically by first name
      const searchResults = Array.from(resultsMap.values())
        .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
        .slice(0, PREVIEW_RESULTS_LIMIT);

      setPreviewResults(searchResults);
      setShowPreview(searchResults.length > 0);
    } catch (error) {
      console.error('Live search error:', error);
    } finally {
      setPreviewLoading(false);
    }
  }, [user]);

  // Debounced live search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm && !hasSearched) {
        performLiveSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performLiveSearch, hasSearched]);

  // Load existing invites for users
  const loadExistingInvites = async (users: (SearchResult | SuggestedUser)[]) => {
    if (!user?.uid) return;

    for (const result of users) {
      const existingInvites = new Set<string>();
      
      for (const circleId of Object.keys(standardCircles)) {
        const inviteRef = doc(db, 'invitations', `${user.uid}_${result.uid}_${circleId}`);
        const inviteDoc = await getDoc(inviteRef);
        
        if (inviteDoc.exists() && inviteDoc.data().status === 'pending') {
          existingInvites.add(circleId);
        }
      }
      
      result.existingInvites = existingInvites;
    }
  };

  // Handle selecting a user from preview
  const handleSelectPreviewUser = async (selectedUser: SearchResult) => {
    // Set search term to show selected user
    setSearchTerm(selectedUser.firstName + ' ' + selectedUser.lastName);
    setShowPreview(false);
    setHasSearched(true);
    setCurrentPage(1);
    
    // Set this user as the only search result
    setResults([selectedUser]);
    setTotalResults(1);
    
    // Load their existing invites
    await loadExistingInvites([selectedUser]);
  };

  // Full search with pagination - searches both first name AND last name
  const handleSearch = async (page = 1) => {
    if (!searchTerm.trim() || !user) return;
    
    setLoading(true);
    setHasSearched(true);
    setShowPreview(false);
    
    try {
      const usersRef = collection(db, 'users');
      const lowerTerm = searchTerm.toLowerCase();
      
      console.log('🔍 Full Search Debug:', { searchTerm, lowerTerm, page });
      
      // For efficiency, limit each query to reasonable number for search
      const SEARCH_LIMIT = 50; // Reasonable limit for search queries
      
      // Query 1: Search by first name
      const firstNameQuery = query(
        usersRef,
        where('firstName_lowercase', '>=', lowerTerm),
        where('firstName_lowercase', '<=', lowerTerm + '\uf8ff'),
        orderBy('firstName_lowercase'),
        limit(SEARCH_LIMIT)
      );
      
      // Query 2: Search by last name  
      const lastNameQuery = query(
        usersRef,
        where('lastName_lowercase', '>=', lowerTerm),
        where('lastName_lowercase', '<=', lowerTerm + '\uf8ff'),
        orderBy('lastName_lowercase'),
        limit(SEARCH_LIMIT)
      );
      
      // Execute both queries
      const [firstNameSnapshot, lastNameSnapshot] = await Promise.all([
        getDocs(firstNameQuery),
        getDocs(lastNameQuery)
      ]);
      
      console.log('📊 Query Results:', {
        firstNameCount: firstNameSnapshot.docs.length,
        lastNameCount: lastNameSnapshot.docs.length,
        firstNameDocs: firstNameSnapshot.docs.map(d => ({ id: d.id, data: d.data() })),
        lastNameDocs: lastNameSnapshot.docs.map(d => ({ id: d.id, data: d.data() }))
      });
      
      // Combine results and remove duplicates
      const resultsMap = new Map<string, SearchResult>();
      
      // Add first name results
      firstNameSnapshot.docs.forEach(doc => {
        if (doc.id !== user.uid) {
          resultsMap.set(doc.id, { ...doc.data(), uid: doc.id } as SearchResult);
        }
      });
      
      // Add last name results (will overwrite duplicates, which is fine)
      lastNameSnapshot.docs.forEach(doc => {
        if (doc.id !== user.uid) {
          resultsMap.set(doc.id, { ...doc.data(), uid: doc.id } as SearchResult);
        }
      });
      
      // Convert to array and sort alphabetically by first name
      const allResults = Array.from(resultsMap.values())
        .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
      
      console.log('✅ Final Results:', {
        allResultsCount: allResults.length,
        allResults: allResults.map(r => ({ uid: r.uid, firstName: r.firstName, lastName: r.lastName }))
      });
      
      // Handle pagination manually since we combined results
      const totalCount = allResults.length;
      const startIndex = (page - 1) * RESULTS_PER_PAGE;
      const endIndex = startIndex + RESULTS_PER_PAGE;
      const searchResults = allResults.slice(startIndex, endIndex);

      console.log('📄 Pagination:', { totalCount, startIndex, endIndex, searchResultsCount: searchResults.length });

      // Check for existing invitations
      await loadExistingInvites(searchResults);

      setResults(searchResults);
      setTotalResults(totalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCircleSelection = (userId: string, circleId: string) => {
    setSelectedCircles(prev => {
      const userCircles = prev[userId] || new Set();
      const newCircles = new Set(userCircles);
      
      if (newCircles.has(circleId)) {
        newCircles.delete(circleId);
      } else {
        newCircles.add(circleId);
      }
      
      return {
        ...prev,
        [userId]: newCircles
      };
    });
  };

  const handleInvite = async (targetUserId: string) => {
    if (!user || !selectedCircles[targetUserId]?.size) return;

    setInviting(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      const batch = writeBatch(db);
      const selectedCircleIds = Array.from(selectedCircles[targetUserId]);

      // Create new invitations
      for (const circleId of selectedCircleIds) {
        const existingInviteRef = doc(db, 'invitations', `${user.uid}_${targetUserId}_${circleId}`);
        const existingInvite = await getDoc(existingInviteRef);

        if (!existingInvite.exists()) {
          batch.set(existingInviteRef, {
            fromUid: user.uid,
            toUid: targetUserId,
            circleId,
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }

      await batch.commit();

      // Update local state for search results
      setResults(prev => 
        prev.map(result => {
          if (result.uid === targetUserId) {
            const newExistingInvites = new Set(result.existingInvites || []);
            selectedCircleIds.forEach(circleId => newExistingInvites.add(circleId));
            return { ...result, existingInvites: newExistingInvites };
          }
          return result;
        })
      );

      // Update local state for suggested users
      setSuggestedUsers(prev => 
        prev.map(user => {
          if (user.uid === targetUserId) {
            const newExistingInvites = new Set(user.existingInvites || []);
            selectedCircleIds.forEach(circleId => newExistingInvites.add(circleId));
            return { ...user, existingInvites: newExistingInvites };
          }
          return user;
        })
      );

      // Clear selection
      setSelectedCircles(prev => {
        const newState = { ...prev };
        delete newState[targetUserId];
        return newState;
      });
    } catch (error) {
      console.error('Invitation error:', error);
    } finally {
      setInviting(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const nextSuggestedUser = () => {
    setCurrentSuggestedIndex(prev => 
      prev + 1 >= suggestedUsers.length ? 0 : prev + 1
    );
  };

  const previousSuggestedUser = () => {
    setCurrentSuggestedIndex(prev => 
      prev - 1 < 0 ? suggestedUsers.length - 1 : prev - 1
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Find People</h1>

      {/* Suggested Users Carousel */}
      {suggestedUsers.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Suggested Connections</h2>
          <div className="bg-gray-800 rounded-lg p-6 relative">
            <div className="flex items-center justify-between">
              <button
                onClick={previousSuggestedUser}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-700 p-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex-1 px-16 text-center">
                {suggestedUsers[currentSuggestedIndex] && (
                  <div>
                    <div className="flex items-center justify-center mb-4">
                      <Avatar
                        src={suggestedUsers[currentSuggestedIndex].avatarUrl}
                        alt={`${suggestedUsers[currentSuggestedIndex].firstName}'s profile`}
                        size={80}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {suggestedUsers[currentSuggestedIndex].firstName} {suggestedUsers[currentSuggestedIndex].lastName}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Connected with {suggestedUsers[currentSuggestedIndex].mutualMember.name} in {suggestedUsers[currentSuggestedIndex].mutualMember.circle}
                    </p>
                    <div className="flex justify-center space-x-4 mb-4">
                      {Object.entries(standardCircles)
                        .filter(([id]) => !['attraction', 'eco'].includes(id))
                        .map(([id, circle]) => {
                        const currentUser = suggestedUsers[currentSuggestedIndex];
                        const isInvited = currentUser.existingInvites?.has(id);
                        // If this circle was preselected and no other circles are selected, disable other options
                        const isDisabled = isInvited || (preselectedCircle && preselectedCircle !== id);
                        return (
                          <button
                            key={id}
                            onClick={() => {
                              !isDisabled && toggleCircleSelection(currentUser.uid, id);
                            }}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              isInvited || isDisabled
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : selectedCircles[currentUser.uid]?.has(id)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {circle.icon} {circle.name}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Send Invite Button */}
                    {selectedCircles[suggestedUsers[currentSuggestedIndex].uid]?.size > 0 && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleInvite(suggestedUsers[currentSuggestedIndex].uid)}
                          disabled={inviting[suggestedUsers[currentSuggestedIndex].uid]}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-3 min-h-[44px] rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        >
                          {inviting[suggestedUsers[currentSuggestedIndex].uid] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white inline-block mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            'Send Invite'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={nextSuggestedUser}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-700 p-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center mt-6">
              {suggestedUsers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSuggestedIndex(index)}
                  className={`w-2 h-2 rounded-full mx-1 transition-colors ${
                    index === currentSuggestedIndex ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="mb-8">
        <div className="relative">
          <div className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHasSearched(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchTerm && !hasSearched && setShowPreview(true)}
                onBlur={() => setTimeout(() => setShowPreview(false), 150)}
                placeholder="Search by first or last name..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Live Search Preview */}
              {showPreview && searchTerm && !hasSearched && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 shadow-lg z-10 max-h-80 overflow-y-auto">
                  {previewLoading ? (
                    <div className="p-4 text-center text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  ) : previewResults.length > 0 ? (
                    <>
                      <div className="p-2 text-xs text-gray-400 border-b border-gray-700">
                        Preview - Press Enter or click Search for full results
                      </div>
                      {previewResults.map(result => (
                        <div 
                          key={`preview_${result.uid}`} 
                          onClick={() => handleSelectPreviewUser(result)}
                          className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar
                              src={result.avatarUrl}
                              alt={`${result.firstName}'s profile`}
                              size={32}
                              showBorder={false}
                            />
                            <div>
                              <div className="text-white text-sm font-medium flex items-center gap-2">
                                {result.firstName} {result.lastName}
                                {result.isPremium && <PremiumBadge size="sm" />}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {result.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSearch(1)}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 min-h-[44px] rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <>
            {results.length > 0 && (
              <div className="mb-4 text-gray-400 text-sm">
                Showing {((currentPage - 1) * RESULTS_PER_PAGE) + 1}-{Math.min(currentPage * RESULTS_PER_PAGE, totalResults)} of {totalResults} results
              </div>
            )}
            
            <div className="space-y-4 mb-8">
              {results.map(result => (
                <div key={`result_${result.uid}`} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar
                      src={result.avatarUrl}
                      alt={`${result.firstName}'s profile`}
                      size={64}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                        {result.firstName} {result.lastName}
                        {result.isPremium && <PremiumBadge size="sm" />}
                      </h3>
                      <div className="text-gray-400 text-sm mb-4">
                        {result.email}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(standardCircles)
                          .filter(([id]) => !['attraction', 'eco'].includes(id))
                          .map(([id, circle]) => {
                          const isInvited = result.existingInvites?.has(id);
                          // If this circle was preselected and no other circles are selected, disable other options
                          const isDisabled = isInvited || (preselectedCircle && preselectedCircle !== id);
                          return (
                            <button
                              key={id}
                              onClick={() => !isDisabled && toggleCircleSelection(result.uid, id)}
                              disabled={isDisabled}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                isInvited || isDisabled
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : selectedCircles[result.uid]?.has(id)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {circle.icon} {circle.name}
                              {isInvited && ' (Invited)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedCircles[result.uid]?.size > 0 && (
                    <button
                      onClick={() => handleInvite(result.uid)}
                      disabled={inviting[result.uid]}
                      className="mt-4 w-full bg-blue-500 text-white py-3 min-h-[44px] rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inviting[result.uid] ? 'Sending Invites...' : 'Send Invites'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalResults > RESULTS_PER_PAGE && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handleSearch(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-3 min-h-[44px] bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {(() => {
                    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
                    const pages = [];
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, currentPage + 2);
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    return pages.map(page => (
                      <button
                        key={page}
                        onClick={() => handleSearch(page)}
                        disabled={loading}
                        className={`px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>
                
                <button
                  onClick={() => handleSearch(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalResults / RESULTS_PER_PAGE) || loading}
                  className="px-4 py-3 min-h-[44px] bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {hasSearched && results.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No results found</div>
                <div className="text-gray-500 text-sm">Try searching with a different name</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
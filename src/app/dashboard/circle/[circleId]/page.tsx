'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc as firestoreDoc, 
  deleteDoc, 
  writeBatch, 
  getDoc, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { standardCircles } from '@/lib/traits-library';
import type { AppUser, Rating } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface CircleMember extends AppUser {
  joinedAt: Date;
}

interface MonthlyScore {
  month: string;
  score: number;
}

export default function CircleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.circleId as string;
  console.log('CircleId:', circleId);

  const { user } = useAuthContext();
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [monthlyScores, setMonthlyScores] = useState<MonthlyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<CircleMember | null>(null);

  const circle = standardCircles[circleId as keyof typeof standardCircles];
  console.log('Circle:', circle);

  useEffect(() => {
    // Redirect attraction to ratings page since it doesn't have traditional circle details
    if (circleId === 'attraction') {
      router.push('/dashboard/attraction');
      return;
    }
    
    async function loadCircleData() {
      if (!user?.uid || !circleId) {
        console.log('Missing user or circleId:', { user, circleId });
        return;
      }

      try {
        console.log('Loading circle data for:', circleId);
        
        // Get circle members
        const membersRef = collection(db, 'userCircles');
        const q = query(
          membersRef,
          where('circleId', '==', circleId),
          where('ownerUid', '==', user.uid)
        );
        
        const snapshot = await getDocs(q);
        console.log('Found members:', snapshot.size);
        
        const memberPromises = snapshot.docs
          .filter(doc => doc.data().memberUid !== user.uid) // Filter out yourself
          .map(async (doc) => {
            const data = doc.data();
            const userDoc = await getDoc(firestoreDoc(db, 'users', data.memberUid));
            if (userDoc.exists()) {
              return {
                ...userDoc.data(),
                uid: data.memberUid,
                joinedAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
              } as CircleMember;
            }
            return null;
          });

        const memberData = (await Promise.all(memberPromises)).filter((m): m is CircleMember => m !== null);
        console.log('Processed members:', memberData);
        setMembers(memberData);

        // Get monthly scores - simplified query to avoid composite index
        const ratingsRef = collection(db, 'ratings');
        const ratingsQuery = query(
          ratingsRef,
          where('ratedUid', '==', user.uid),
          where('circleId', '==', circleId)
        );

        const ratingsSnapshot = await getDocs(ratingsQuery);
        // Sort and limit on client side
        const ratings = ratingsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            };
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 12) as Rating[];

        // Calculate monthly averages
        const monthlyData = new Map<string, { total: number; count: number; date: Date }>();
        ratings.forEach(rating => {
          const date = rating.createdAt;
          const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const scores = Object.values(rating.scores);
          
          if (scores.length > 0) {
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            
            const existing = monthlyData.get(month) || { total: 0, count: 0, date };
            monthlyData.set(month, {
              total: existing.total + avgScore,
              count: existing.count + 1,
              date: existing.date || date
            });
          }
        });

        // Generate last 6 months including current month
        const now = new Date();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          last6Months.push(monthKey);
        }

        const scores: MonthlyScore[] = last6Months.map(month => {
          const data = monthlyData.get(month);
          return {
            month: month.replace(' ', '\n'), // Add line break for better display
            score: data ? Number((data.total / data.count).toFixed(1)) : 0
          };
        });

        setMonthlyScores(scores);
      } catch (err) {
        console.error('Error loading circle data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load circle data');
      } finally {
        setLoading(false);
      }
    }

    loadCircleData();
  }, [circleId, user?.uid]);

  const handleRemoveMember = async (member: CircleMember) => {
    setMemberToRemove(member);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !user?.uid) return;

    try {
      const batch = writeBatch(db);

      // Remove member from your circle
      const yourCircleQuery = query(
        collection(db, 'userCircles'),
        where('circleId', '==', circleId),
        where('ownerUid', '==', user.uid),
        where('memberUid', '==', memberToRemove.uid)
      );
      const yourCircleSnapshot = await getDocs(yourCircleQuery);
      yourCircleSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Remove yourself from their circle
      const theirCircleQuery = query(
        collection(db, 'userCircles'),
        where('circleId', '==', circleId),
        where('ownerUid', '==', memberToRemove.uid),
        where('memberUid', '==', user.uid)
      );
      const theirCircleSnapshot = await getDocs(theirCircleQuery);
      theirCircleSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Update local state
      setMembers(prev => prev.filter(m => m.uid !== memberToRemove.uid));
      setMemberToRemove(null);
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  if (!circle) {
    console.log('Circle not found, rendering error state');
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-6">Circle not found</h1>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/dashboard" 
            className="text-sm text-gray-400 hover:text-white transition-colors mb-2 block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">{circle.icon}</span>
            {circle.name} Circle Details
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members List */}
        <div className="bg-[#1a1b1e] rounded-xl border border-[#2a2b2e] overflow-hidden">
          <div className="p-4 border-b border-[#2a2b2e] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Members</h2>
            <span className="text-sm text-gray-400">
              {members.length + 1} {(members.length + 1) === 1 ? 'member' : 'members'}
            </span>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No other members in this circle
            </div>
          ) : (
            <div className="divide-y divide-[#2a2b2e]">
              {members.map(member => (
                <div key={member.uid} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={`${member.firstName}'s profile`}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Member Info */}
                    <div>
                      <h3 className="text-white font-medium">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Joined {member.joinedAt ? member.joinedAt.toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Scores Graph */}
        <div className="bg-[#1a1b1e] rounded-xl border border-[#2a2b2e] overflow-hidden relative">
          <div className="p-4 border-b border-[#2a2b2e]">
            <h2 className="text-xl font-semibold text-white">Monthly Scores</h2>
          </div>
          
          <div className={`p-6 ${['friends', 'work', 'general'].includes(circleId) && (members.length + 1) < 4 ? 'blur-sm' : ''}`}>
            {monthlyScores.length === 0 || monthlyScores.every(s => s.score === 0) ? (
              <div className="text-center py-12 text-gray-400">
                <div className="mb-2">📊</div>
                <div className="text-lg font-medium mb-1">No ratings received yet</div>
                <div className="text-sm">Monthly scores will appear here once you receive ratings</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Chart */}
                <div className="h-64 flex items-end justify-between gap-3 bg-gray-900/30 rounded-lg p-4">
                  {monthlyScores.map((scoreData, index) => {
                    const height = scoreData.score > 0 ? Math.max((scoreData.score / 10) * 100, 5) : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        {/* Score value on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-800 px-2 py-1 rounded text-xs text-white">
                          {scoreData.score > 0 ? scoreData.score.toFixed(1) : 'No data'}
                        </div>
                        
                        {/* Bar */}
                        <div className="w-full h-full flex items-end">
                          <div 
                            className={`w-full rounded-t-md transition-all duration-700 ${
                              scoreData.score > 0 
                                ? 'bg-gradient-to-t from-blue-600 to-blue-400' 
                                : 'bg-gray-700'
                            }`}
                            style={{ 
                              height: `${height}%`,
                              minHeight: scoreData.score > 0 ? '8px' : '4px'
                            }}
                          />
                        </div>
                        
                        {/* Month label */}
                        <div className="mt-3 text-xs text-gray-400 text-center leading-tight whitespace-pre-line">
                          {scoreData.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-700 pt-4">
                  <div>Average rating: 1-10 scale</div>
                  <div>Last 6 months</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Monthly Scores Minimum Members Overlay */}
          {['friends', 'work', 'general'].includes(circleId) && (members.length + 1) < 4 && (
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center px-4">
                <div className="bg-yellow-500/10 rounded-full p-3 mb-3 w-12 h-12 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Need More Members</h3>
                <p className="text-sm text-gray-300 mb-1">
                  Add {4 - (members.length + 1)} more {4 - (members.length + 1) === 1 ? 'member' : 'members'} to view scores
                </p>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1b1e] rounded-xl border border-[#2a2b2e] p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Remove Member</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to remove {memberToRemove.firstName} {memberToRemove.lastName} from your circle? 
              This will also remove you from their circle. You can always invite them back later.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveMember}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
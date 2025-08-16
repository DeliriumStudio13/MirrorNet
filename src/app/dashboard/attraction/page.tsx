'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { standardCircles, getTraitsForCircle } from '@/lib/traits-library';
import type { AppUser, Rating, RevealRequest } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Eye, EyeOff, Sparkles, Send, Crown, Star, Calendar, User } from 'lucide-react';

interface AttractionRating extends Rating {
  raterUser?: AppUser;
  averageScore: number;
  canRequestReveal: boolean;
  hasRequestedReveal: boolean;
}

export default function AttractionDashboardPage() {
  const { user } = useAuthContext();
  const [ratings, setRatings] = useState<AttractionRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingReveal, setRequestingReveal] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRatings: 0,
    averageScore: 0,
    revealedCount: 0,
    anonymousCount: 0
  });

  const circle = standardCircles.attraction;
  const traits = getTraitsForCircle('attraction');

  useEffect(() => {
    async function loadAttractionRatings() {
      if (!user?.uid) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get all attraction ratings where this user is the rated person
        const ratingsRef = collection(db, 'ratings');
        const ratingsQuery = query(
          ratingsRef,
          where('ratedUid', '==', user.uid),
          where('circleId', '==', 'attraction')
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        
        if (ratingsSnapshot.empty) {
          setRatings([]);
          setLoading(false);
          return;
        }

        // Get existing reveal requests
        const revealRequestsRef = collection(db, 'revealRequests');
        const revealRequestsQuery = query(
          revealRequestsRef,
          where('fromUid', '==', user.uid)
        );
        const revealRequestsSnapshot = await getDocs(revealRequestsQuery);
        const existingRequests = new Set(
          revealRequestsSnapshot.docs.map(doc => doc.data().ratingId)
        );

        const ratingsData: AttractionRating[] = [];
        let totalScore = 0;
        let totalCount = 0;
        let revealedCount = 0;
        let anonymousCount = 0;

        for (const ratingDoc of ratingsSnapshot.docs) {
          const ratingData = ratingDoc.data() as Rating;
          
          // Calculate average score for this rating
          const scores = Object.values(ratingData.scores);
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          totalScore += avgScore;
          totalCount++;

          // Load rater info if revealed
          let raterUser: AppUser | undefined;
          if (ratingData.isRevealed) {
            const raterDoc = await getDoc(doc(db, 'users', ratingData.raterUid));
            if (raterDoc.exists()) {
              raterUser = { uid: ratingData.raterUid, ...raterDoc.data() } as AppUser;
            }
            revealedCount++;
          } else {
            anonymousCount++;
          }

          ratingsData.push({
            ...ratingData,
            id: ratingDoc.id,
            raterUser,
            averageScore: Number(avgScore.toFixed(1)),
            canRequestReveal: !ratingData.isRevealed && !existingRequests.has(ratingDoc.id),
            hasRequestedReveal: existingRequests.has(ratingDoc.id)
          });
        }

        // Sort by creation date (newest first)
        ratingsData.sort((a, b) => {
          const aDate = a.createdAt instanceof Date ? a.createdAt : (a.createdAt ? new Date(a.createdAt) : new Date());
          const bDate = b.createdAt instanceof Date ? b.createdAt : (b.createdAt ? new Date(b.createdAt) : new Date());
          return bDate.getTime() - aDate.getTime();
        });

        setRatings(ratingsData);
        setStats({
          totalRatings: totalCount,
          averageScore: totalCount > 0 ? Number((totalScore / totalCount).toFixed(1)) : 0,
          revealedCount,
          anonymousCount
        });

      } catch (err) {
        console.error('Error loading attraction ratings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ratings');
      } finally {
        setLoading(false);
      }
    }

    loadAttractionRatings();
  }, [user?.uid]);

  const handleRequestReveal = async (ratingId: string, raterUid: string) => {
    if (!user?.uid || !user.isPremium || user.premiumTokens <= 0) return;

    setRequestingReveal(ratingId);
    try {
      // Create reveal request
      await addDoc(collection(db, 'revealRequests'), {
        fromUid: user.uid,
        toUid: raterUid,
        ratingId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Deduct premium token
      await updateDoc(doc(db, 'users', user.uid), {
        premiumTokens: user.premiumTokens - 1
      });

      // Update local state
      setRatings(prev => prev.map(rating => 
        rating.id === ratingId 
          ? { ...rating, canRequestReveal: false, hasRequestedReveal: true }
          : rating
      ));

    } catch (error) {
      console.error('Error requesting reveal:', error);
      setError('Failed to send reveal request');
    } finally {
      setRequestingReveal(null);
    }
  };

  // Standard users get a limited view
  if (!user?.isPremium) {
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
              Attraction Circle
            </h1>
            <p className="text-gray-400 mt-2">
              Rate members from your circles (Family circle excluded)
            </p>
          </div>
          <Link 
            href="/dashboard/rate/attraction"
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
          >
            Rate Others
          </Link>
        </div>

        {/* Standard User Stats - Count Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">{stats.totalRatings}</div>
            <div className="text-gray-400">Attraction Ratings Received</div>
            <p className="text-gray-500 text-sm mt-2">
              This is how many people have rated you
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6 text-center">
            <Crown className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <div className="text-lg font-semibold text-white mb-2">Premium Features</div>
            <div className="text-gray-300 text-sm mb-4">
              • See detailed ratings & scores<br/>
              • Rate anyone in the app<br/>
              • Request identity reveals
            </div>
            <Link 
              href="/dashboard/premium"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm font-medium"
            >
              Upgrade to Premium
            </Link>
          </div>
        </div>

        {/* How it Works for Standard Users */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">How Attraction Circle Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-pink-400 mb-2">For You (Standard User)</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Rate members from all your circles (except Family)</li>
                <li>• All your ratings are anonymous by default</li>
                <li>• See count of ratings you've received</li>
                <li>• Cannot see detailed scores or who rated you</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-purple-400 mb-2">Premium Users Can</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• See all ratings and detailed scores received</li>
                <li>• Rate anyone in the app (with tokens)</li>
                <li>• Choose to reveal their identity when rating</li>
                <li>• Request reveals from anonymous raters</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {stats.totalRatings === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-lg">
            <Heart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Ratings Yet</h3>
            <p className="text-gray-400 mb-6">
              Start rating others to encourage them to rate you back!
            </p>
            <Link 
              href="/dashboard/rate/attraction"
              className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              <Heart className="h-4 w-4" />
              Start Rating Others
            </Link>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-pink-400 mb-2">🎉 {stats.totalRatings} people find you attractive!</div>
            <p className="text-gray-400 mb-4">
              Want to see who they are and what they think about you?
            </p>
            <Link 
              href="/dashboard/premium"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
            >
              Unlock Premium Features
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading your attraction ratings...</p>
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
            Your Attraction Ratings
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Premium Feature - See who finds you attractive
          </p>
        </div>
        <Link 
          href="/dashboard/rate/attraction"
          className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
        >
          Rate Others
        </Link>
      </div>

      {/* Premium Token Info */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-purple-300 font-medium">Premium Tokens: {user.premiumTokens}</span>
          </div>
          <p className="text-gray-300 text-sm">
            Use tokens to request identity reveals from anonymous raters
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-pink-400 mb-1">{stats.totalRatings}</div>
          <div className="text-gray-400 text-sm">Total Ratings</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-pink-400 mb-1">{stats.averageScore}</div>
          <div className="text-gray-400 text-sm">Average Score</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.revealedCount}</div>
          <div className="text-gray-400 text-sm">Revealed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-orange-400 mb-1">{stats.anonymousCount}</div>
          <div className="text-gray-400 text-sm">Anonymous</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Ratings List */}
      {ratings.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-lg">
          <Heart className="h-16 w-16 text-gray-600 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-4">No Attraction Ratings Yet</h3>
          <p className="text-gray-400 mb-6">
            You haven't received any attraction ratings yet. Share your profile with others to start receiving feedback!
          </p>
          <Link 
            href="/dashboard/rate/attraction"
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium"
          >
            <Heart className="h-4 w-4" />
            Start Rating Others
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {ratings.map((rating) => (
            <div key={rating.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-6">
                {/* Rating Header */}
                <div className="flex items-start gap-4">
                  {rating.isRevealed && rating.raterUser ? (
                    // Revealed Rating
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-green-500">
                        {rating.raterUser.avatarUrl ? (
                          <Image
                            src={rating.raterUser.avatarUrl}
                            alt={`${rating.raterUser.firstName}'s profile`}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {rating.raterUser.firstName} {rating.raterUser.lastName}
                          </h3>
                          <Eye className="h-4 w-4 text-green-400" />
                        </div>
                        <p className="text-green-400 text-sm">Revealed Identity</p>
                      </div>
                    </div>
                  ) : (
                    // Anonymous Rating
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                        <EyeOff className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">Anonymous Admirer</h3>
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-sm">Identity Hidden</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Average Score & Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400 flex items-center gap-1">
                      <Star className="h-5 w-5 fill-current" />
                      {rating.averageScore}
                    </div>
                    <p className="text-gray-400 text-xs">Average</p>
                  </div>
                  
                  {/* Reveal Request Button */}
                  {!rating.isRevealed && rating.canRequestReveal && user.premiumTokens > 0 && (
                    <button
                      onClick={() => handleRequestReveal(rating.id, rating.raterUid)}
                      disabled={requestingReveal === rating.id}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {requestingReveal === rating.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Request Reveal (1 token)
                    </button>
                  )}
                  
                  {rating.hasRequestedReveal && (
                    <div className="bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-lg text-sm">
                      Reveal Requested
                    </div>
                  )}
                </div>
              </div>

              {/* Trait Scores */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                {traits.map((trait) => {
                  const score = rating.scores[trait.id] || 0;
                  return (
                    <div key={trait.id} className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-pink-400 mb-1">{score}</div>
                      <div className="text-white text-sm font-medium mb-1">{trait.name}</div>
                      <div className="text-xs text-gray-400">{trait.description}</div>
                    </div>
                  );
                })}
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="h-4 w-4" />
                Received {rating.createdAt ? new Date(rating.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Recently'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

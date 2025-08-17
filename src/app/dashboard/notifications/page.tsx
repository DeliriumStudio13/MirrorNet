'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, writeBatch, getDoc, getDocs, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { standardCircles } from '@/lib/traits-library';
import { Heart, Users, Eye, EyeOff } from 'lucide-react';

interface Invitation {
  id: string;
  fromUid: string;
  circleId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  fromUser?: {
    firstName: string;
    lastName: string;
  };
  circleName?: string; // For custom circles
  isCustomCircle?: boolean;
}

interface RevealRequest {
  id: string;
  fromUid: string;
  toUid: string;
  ratingId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  fromUser?: {
    firstName: string;
    lastName: string;
  };
}

interface FamilyGoalNotification {
  id: string;
  type: 'family_goal';
  fromUid: string;
  toUid: string;
  goalId: string;
  title: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  fromUser?: {
    firstName: string;
    lastName: string;
  };
}

export default function NotificationsPage() {
  const { user } = useAuthContext();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [revealRequests, setRevealRequests] = useState<RevealRequest[]>([]);
  const [familyGoals, setFamilyGoals] = useState<FamilyGoalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'invitations' | 'reveals' | 'goals'>('invitations');

  useEffect(() => {
    if (!user) return;

    const unsubscribers: (() => void)[] = [];

    // Listen for invitations
    const invitationsQuery = query(
      collection(db, 'invitations'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const invitationsUnsubscribe = onSnapshot(invitationsQuery, async (snapshot) => {
      const invitesWithUsers: Invitation[] = [];

      for (const docSnapshot of snapshot.docs) {
        const invitationData = docSnapshot.data();
        const invitation: Invitation = {
          id: docSnapshot.id,
          fromUid: invitationData.fromUid,
          circleId: invitationData.circleId,
          status: invitationData.status,
          createdAt: invitationData.createdAt,
        };

        // Fetch sender's info
        const fromUserDocRef = doc(db, 'users', invitation.fromUid);
        const fromUserDoc = await getDoc(fromUserDocRef);
        
        if (fromUserDoc.exists()) {
          const userData = fromUserDoc.data();
          invitation.fromUser = {
            firstName: userData.firstName,
            lastName: userData.lastName,
          };
        }

        // Check if this is a custom circle and get its name
        const customCircleDoc = await getDoc(doc(db, 'customCircles', invitation.circleId));
        if (customCircleDoc.exists()) {
          const customCircleData = customCircleDoc.data();
          invitation.circleName = customCircleData.name;
          invitation.isCustomCircle = true;
        } else {
          // Use standard circle name
          const standardCircle = standardCircles[invitation.circleId as keyof typeof standardCircles];
          invitation.circleName = standardCircle ? standardCircle.name : invitation.circleId;
          invitation.isCustomCircle = false;
        }

        invitesWithUsers.push(invitation);
      }

      setInvitations(invitesWithUsers);
      setLoading(false);
    });
    unsubscribers.push(invitationsUnsubscribe);

    // Listen for reveal requests (all users can receive them)
    const revealRequestsQuery = query(
      collection(db, 'revealRequests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const revealRequestsUnsubscribe = onSnapshot(revealRequestsQuery, async (snapshot) => {
      const requestsWithUsers: RevealRequest[] = [];

      for (const docSnapshot of snapshot.docs) {
        const requestData = docSnapshot.data();
        const request: RevealRequest = {
          id: docSnapshot.id,
          fromUid: requestData.fromUid,
          toUid: requestData.toUid,
          ratingId: requestData.ratingId,
          status: requestData.status,
          createdAt: requestData.createdAt,
        };

        // Fetch requester's info
        const fromUserDocRef = doc(db, 'users', request.fromUid);
        const fromUserDoc = await getDoc(fromUserDocRef);
        
        if (fromUserDoc.exists()) {
          const userData = fromUserDoc.data();
          request.fromUser = {
            firstName: userData.firstName,
            lastName: userData.lastName,
          };
        }

        requestsWithUsers.push(request);
      }

      setRevealRequests(requestsWithUsers);
    });
    unsubscribers.push(revealRequestsUnsubscribe);

    // Listen for family goal notifications
    const familyGoalsQuery = query(
      collection(db, 'notifications'),
      where('toUid', '==', user.uid),
      where('type', '==', 'family_goal'),
      where('read', '==', false)
    );

    const familyGoalsUnsubscribe = onSnapshot(familyGoalsQuery, async (snapshot) => {
      const goalsWithUsers: FamilyGoalNotification[] = [];

      for (const docSnapshot of snapshot.docs) {
        const goalData = docSnapshot.data();
        const goal: FamilyGoalNotification = {
          id: docSnapshot.id,
          type: goalData.type,
          fromUid: goalData.fromUid,
          toUid: goalData.toUid,
          goalId: goalData.goalId,
          title: goalData.title,
          message: goalData.message,
          createdAt: goalData.createdAt,
          read: goalData.read,
        };

        // Fetch sender's info
        const fromUserDocRef = doc(db, 'users', goal.fromUid);
        const fromUserDoc = await getDoc(fromUserDocRef);
        
        if (fromUserDoc.exists()) {
          const userData = fromUserDoc.data();
          goal.fromUser = {
            firstName: userData.firstName,
            lastName: userData.lastName,
          };
        }

        goalsWithUsers.push(goal);
      }

      setFamilyGoals(goalsWithUsers);
    });
    unsubscribers.push(familyGoalsUnsubscribe);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const handleInvitation = async (invitationId: string, accept: boolean) => {
    if (!user) return;

    setProcessing(prev => ({ ...prev, [invitationId]: true }));

    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) return;

      const batch = writeBatch(db);

      // Update invitation status
      const inviteRef = doc(db, 'invitations', invitationId);
      batch.update(inviteRef, {
        status: accept ? 'accepted' : 'declined',
      });

      if (accept) {
        // Check if this is a custom circle invitation
        const customCircleDoc = await getDoc(doc(db, 'customCircles', invitation.circleId));
        
        if (customCircleDoc.exists()) {
          // Handle custom circle acceptance
          const customCircleData = customCircleDoc.data();
          
          // Check membership limits
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const currentMemberships = userData?.customCircleMemberships || [];
          const maxMemberships = userData?.isPremium ? 1 : 1; // Both can join 1
          
          if (currentMemberships.length >= maxMemberships) {
            alert('You have reached your custom circle membership limit.');
            return;
          }
          
          // Update custom circle membership status
          const membershipQuery = query(
            collection(db, 'customCircleMemberships'),
            where('circleId', '==', invitation.circleId),
            where('memberUid', '==', user.uid)
          );
          const membershipSnapshot = await getDocs(membershipQuery);
          
          if (!membershipSnapshot.empty) {
            const membershipDoc = membershipSnapshot.docs[0];
            batch.update(membershipDoc.ref, {
              status: 'active',
              joinedAt: serverTimestamp()
            });
          } else {
            // Create membership if it doesn't exist (for backwards compatibility)
            const membershipRef = doc(collection(db, 'customCircleMemberships'));
            batch.set(membershipRef, {
              circleId: invitation.circleId,
              memberUid: user.uid,
              ownerUid: customCircleData.ownerUid,
              status: 'active',
              invitedAt: serverTimestamp(),
              joinedAt: serverTimestamp()
            });
          }
          
          // Update user's custom circle memberships
          batch.update(doc(db, 'users', user.uid), {
            customCircleMemberships: [...currentMemberships, invitation.circleId]
          });
          
        } else {
          // Handle standard circle acceptance (existing logic)
          const userCircleRef1 = doc(collection(db, 'userCircles'));
          const userCircleRef2 = doc(collection(db, 'userCircles'));

          // Add user to inviter's circle
          batch.set(userCircleRef1, {
            ownerUid: invitation.fromUid,
            memberUid: user.uid,
            circleId: invitation.circleId,
            createdAt: new Date(),
          });

          // Add inviter to user's circle
          batch.set(userCircleRef2, {
            ownerUid: user.uid,
            memberUid: invitation.fromUid,
            circleId: invitation.circleId,
            createdAt: new Date(),
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error processing invitation:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  const handleRevealRequest = async (requestId: string, accept: boolean) => {
    if (!user) return;

    setProcessing(prev => ({ ...prev, [requestId]: true }));

    try {
      const request = revealRequests.find(req => req.id === requestId);
      if (!request) return;

      // Update reveal request status
      await updateDoc(doc(db, 'revealRequests', requestId), {
        status: accept ? 'accepted' : 'declined',
      });

      if (accept) {
        // Update the rating to be revealed
        await updateDoc(doc(db, 'ratings', request.ratingId), {
          isRevealed: true,
        });
      }

    } catch (error) {
      console.error('Error processing reveal request:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleFamilyGoal = async (notificationId: string, goalId: string, accept: boolean) => {
    setProcessing(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      // Update the goal status
      const goalRef = doc(db, 'familyGoals', goalId);
      await updateDoc(goalRef, {
        status: accept ? 'active' : 'declined',
        respondedAt: serverTimestamp(),
      });

      // Mark notification as read
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    } catch (error) {
      console.error('Error handling family goal:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  const totalNotifications = invitations.length + revealRequests.length + familyGoals.length;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-white">
          Notifications {totalNotifications > 0 && (
            <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded-full ml-2">
              {totalNotifications}
            </span>
          )}
        </h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'invitations'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Circle Invitations ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('reveals')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'reveals'
                ? 'text-pink-400 border-b-2 border-pink-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart className="h-4 w-4 inline mr-2" />
            Reveal Requests ({revealRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'goals'
                ? 'text-red-400 border-b-2 border-red-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Family Goals ({familyGoals.length})
          </button>
        </div>

        {/* Circle Invitations Tab */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            {invitations.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-gray-800/50 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">No pending invitations</h3>
                <p>You'll see circle invitations from other users here.</p>
              </div>
            ) : (
              invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            Circle Invitation from {invitation.fromUser?.firstName} {invitation.fromUser?.lastName}
                          </h3>
                          {invitation.isCustomCircle && (
                            <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-2 py-1 flex items-center gap-1">
                              <svg className="h-3 w-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs text-purple-300 font-medium">Custom</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-400 mt-1">
                          Wants to connect in their "{invitation.circleName}" circle
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleInvitation(invitation.id, true)}
                        disabled={processing[invitation.id]}
                        className="px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[#1a1b1e] disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleInvitation(invitation.id, false)}
                        disabled={processing[invitation.id]}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reveal Requests Tab */}
        {activeTab === 'reveals' && (
          <div className="space-y-4">
            {revealRequests.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-gray-800/50 rounded-lg">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">No reveal requests</h3>
                <p>People who rated you anonymously and want to reveal their identity will appear here.</p>
              </div>
            ) : (
              revealRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center">
                        <Eye className="h-6 w-6 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Reveal Request from {request.fromUser?.firstName} {request.fromUser?.lastName}
                        </h3>
                        <p className="text-gray-400 mt-1">
                          Wants to know who gave them an anonymous rating
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          If you accept, they'll be able to see that you rated them
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRevealRequest(request.id, true)}
                        disabled={processing[request.id]}
                        className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 focus:ring-offset-[#1a1b1e] disabled:opacity-50 flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Reveal
                      </button>
                      <button
                        onClick={() => handleRevealRequest(request.id, false)}
                        disabled={processing[request.id]}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 flex items-center gap-2"
                      >
                        <EyeOff className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Family Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {familyGoals.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-gray-800/50 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">No family goal requests</h3>
                <p>Family goal invitations from premium members will appear here.</p>
              </div>
            ) : (
              familyGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {goal.title}
                        </h3>
                        <p className="text-gray-400 mt-1">
                          {goal.fromUser?.firstName} {goal.fromUser?.lastName} wants to work on this relationship goal with you
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {goal.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleFamilyGoal(goal.id, goal.goalId, true)}
                        disabled={processing[goal.id]}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-[#1a1b1e] disabled:opacity-50 flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        {processing[goal.id] ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleFamilyGoal(goal.id, goal.goalId, false)}
                        disabled={processing[goal.id]}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        {processing[goal.id] ? 'Declining...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
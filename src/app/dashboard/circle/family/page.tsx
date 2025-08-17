'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Heart, Users, UserMinus, Target, Calendar, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PremiumBadge } from '@/components/ui/premium-badge';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/date-utils';

interface FamilyMember {
  uid: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isPremium?: boolean;
  joinedAt: Date;
  isOwner?: boolean;
}

interface FamilyGoal {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  targetDate: Date;
  status: 'pending' | 'active' | 'completed' | 'declined';
  participants: string[];
  tips: string[];
  participantDetails?: FamilyMember[];
}

const PREDEFINED_GOALS = [
  {
    title: "Daily Check-ins",
    description: "Commit to having meaningful 10-minute conversations every day for 30 days",
    tips: [
      "Set a specific time each day for your check-in",
      "Ask open-ended questions like 'What was the best part of your day?'",
      "Put away all devices during this time",
      "Practice active listening without trying to solve problems",
      "Share something you appreciate about each other daily"
    ]
  },
  {
    title: "Weekly Date Nights",
    description: "Plan and enjoy quality time together every week without distractions",
    tips: [
      "Take turns planning the date night",
      "Try new activities together",
      "Create a no-phones rule during dates",
      "Focus on experiences rather than expensive activities",
      "End each date by sharing what you enjoyed most"
    ]
  },
  {
    title: "Gratitude Practice",
    description: "Express appreciation for each other daily and keep a shared gratitude journal",
    tips: [
      "Write three things you appreciate about your partner each day",
      "Be specific in your gratitude expressions",
      "Share your gratitude entries weekly",
      "Notice and acknowledge small gestures",
      "Create gratitude rituals together"
    ]
  },
  {
    title: "Conflict Resolution",
    description: "Learn and practice healthy communication during disagreements for 30 days",
    tips: [
      "Use 'I' statements instead of 'you' statements",
      "Take breaks when emotions run high",
      "Focus on understanding rather than being right",
      "Practice apologizing when you make mistakes",
      "Celebrate successful conflict resolutions"
    ]
  },
  {
    title: "Future Planning",
    description: "Discuss and align on shared goals and dreams for your relationship",
    tips: [
      "Schedule weekly planning sessions",
      "Create vision boards together",
      "Break big dreams into smaller steps",
      "Support each other's individual goals",
      "Regularly review and adjust your plans"
    ]
  }
];

export default function FamilyCirclePage() {
  const { user } = useAuthContext();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<typeof PREDEFINED_GOALS[0] | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [sendingGoal, setSendingGoal] = useState(false);
  const [processingGoal, setProcessingGoal] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    loadFamilyData();
  }, [user?.uid]);

  const loadFamilyData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Load family members
      const membersRef = collection(db, 'userCircles');
      const membersQuery = query(
        membersRef,
        where('ownerUid', '==', user.uid),
        where('circleId', '==', 'family')
      );

      const membersSnapshot = await getDocs(membersQuery);
      const memberPromises = membersSnapshot.docs
        .filter(docSnapshot => docSnapshot.data().memberUid !== user.uid) // Filter out yourself
        .map(async (docSnapshot) => {
          const memberData = docSnapshot.data();
          const userRef = doc(db, 'users', memberData.memberUid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              uid: memberData.memberUid,
              firstName: userData.firstName,
              lastName: userData.lastName,
              avatarUrl: userData.avatarUrl,
              isPremium: userData.isPremium,
              joinedAt: memberData.joinedAt?.toDate() || new Date(),
              isOwner: false
            };
          }
          return null;
        });

      const familyMembers = (await Promise.all(memberPromises)).filter(Boolean) as FamilyMember[];

      // Add yourself as the owner
      familyMembers.unshift({
        uid: user.uid,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isPremium: user.isPremium,
        joinedAt: new Date(), // You're always the original member
        isOwner: true
      });

      // Remove any duplicates based on uid (safety check)
      const uniqueMembers = familyMembers.filter((member, index, array) => 
        array.findIndex(m => m.uid === member.uid) === index
      );

      setMembers(uniqueMembers);

      // Load family goals for ALL users who are participants (not just premium)
      const goalsRef = collection(db, 'familyGoals');
      const goalsQuery = query(
        goalsRef,
        where('participants', 'array-contains', user.uid)
      );
      const goalsSnapshot = await getDocs(goalsQuery);
      const familyGoals = await Promise.all(
        goalsSnapshot.docs.map(async (goalDoc) => {
          const goalData = goalDoc.data();
          const goal = {
            id: goalDoc.id,
            ...goalData,
            createdAt: goalData.createdAt?.toDate() || new Date(),
            targetDate: goalData.targetDate?.toDate() || new Date()
          } as FamilyGoal;

          // Fetch participant details
          if (goal.participants && goal.participants.length > 0) {
            const participantDetails = await Promise.all(
              goal.participants.map(async (participantUid) => {
                const userRef = doc(db, 'users', participantUid);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  return {
                    uid: participantUid,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    avatarUrl: userData.avatarUrl,
                    isPremium: userData.isPremium,
                    joinedAt: new Date(), // Goals don't have specific join dates
                    isOwner: participantUid === user.uid
                  } as FamilyMember;
                }
                return null;
              })
            );
            
            goal.participantDetails = participantDetails.filter(Boolean) as FamilyMember[];
          }

          return goal;
        })
      );

      setGoals(familyGoals);

    } catch (error) {
      console.error('Error loading family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberUid: string) => {
    if (!user?.uid || memberUid === user.uid) return;

    // Get member info for confirmation
    const memberToRemove = members.find(m => m.uid === memberUid);
    if (!memberToRemove) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberToRemove.firstName} ${memberToRemove.lastName} from your Family circle? This will remove you from each other's family circles.`
    );
    
    if (!confirmed) return;

    try {
      setRemoving(memberUid);

      const batch = writeBatch(db);

      // Find and remove all userCircles entries between these two users for family circle
      const userCirclesRef = collection(db, 'userCircles');
      
      // Remove: owner -> member relationship
      const ownerToMemberQuery = query(
        userCirclesRef,
        where('ownerUid', '==', user.uid),
        where('memberUid', '==', memberUid),
        where('circleId', '==', 'family')
      );
      const ownerToMemberSnapshot = await getDocs(ownerToMemberQuery);
      ownerToMemberSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Remove: member -> owner relationship  
      const memberToOwnerQuery = query(
        userCirclesRef,
        where('ownerUid', '==', memberUid),
        where('memberUid', '==', user.uid),
        where('circleId', '==', 'family')
      );
      const memberToOwnerSnapshot = await getDocs(memberToOwnerQuery);
      memberToOwnerSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Update local state
      setMembers(prev => prev.filter(member => member.uid !== memberUid));
      
      console.log(`Successfully removed ${memberToRemove.firstName} from family circle`);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const sendGoalInvite = async () => {
    if (!user?.uid || !selectedGoal || !selectedMember) return;

    try {
      setSendingGoal(true);

      const batch = writeBatch(db);

      // Create the family goal
      const goalRef = doc(collection(db, 'familyGoals'));
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30); // 30 days from now

      batch.set(goalRef, {
        title: selectedGoal.title,
        description: selectedGoal.description,
        createdBy: user.uid,
        createdAt: new Date(),
        targetDate,
        status: 'pending',
        participants: [user.uid, selectedMember.uid],
        tips: selectedGoal.tips
      });

      // Create a notification for the target member
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        type: 'family_goal',
        fromUid: user.uid,
        toUid: selectedMember.uid,
        goalId: goalRef.id,
        title: selectedGoal.title,
        message: `${user.firstName} has invited you to work on a relationship goal: ${selectedGoal.title}`,
        createdAt: new Date(),
        read: false
      });

      await batch.commit();

      setShowGoalModal(false);
      setSelectedGoal(null);
      setSelectedMember(null);
      loadFamilyData(); // Reload to show the new goal
    } catch (error) {
      console.error('Error sending goal invite:', error);
    } finally {
      setSendingGoal(false);
    }
  };

  const handleGoalAction = async (goalId: string, action: 'accept' | 'decline') => {
    if (!user?.uid) return;

    try {
      setProcessingGoal(goalId);

      const batch = writeBatch(db);
      const goalRef = doc(db, 'familyGoals', goalId);
      
      if (action === 'accept') {
        batch.update(goalRef, {
          status: 'active'
        });
      } else {
        batch.update(goalRef, {
          status: 'declined'
        });
      }

      await batch.commit();
      loadFamilyData(); // Reload to show updated status
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setProcessingGoal(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1015] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1015] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-red-500/10 rounded-full p-3">
              <Heart className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Family Circle</h1>
              <p className="text-gray-400">Strengthen your relationships together</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
            </div>
            <Link 
              href="/dashboard/family-assessment" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Take Self-Assessment →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Section */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a1b1e] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Family Members</h2>
                <Link
                  href="/dashboard/search?circle=family"
                  className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Invite Member
                </Link>
              </div>

              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.uid} className="flex items-center justify-between p-4 bg-[#0f1015] rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar
                          src={member.avatarUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          size={48}
                        />
                        {member.isOwner && (
                          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                            <Heart className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">
                            {member.firstName} {member.lastName}
                            {member.isOwner && ' (You)'}
                          </h3>
                          {member.isPremium && <PremiumBadge size="sm" />}
                        </div>
                        <p className="text-sm text-gray-400">
                          {member.isOwner ? 'Circle Owner' : `Joined ${formatDate(member.joinedAt, 'Recently')}`}
                        </p>
                      </div>
                    </div>

                    {!member.isOwner && (
                      <button
                        onClick={() => removeMember(member.uid)}
                        disabled={removing === member.uid}
                        className="text-gray-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                      >
                        {removing === member.uid ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-red-500"></div>
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div>
            <div className="bg-[#1a1b1e] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Relationship Goals</h2>
                {user?.isPremium && members.length > 1 && (
                  <button
                    onClick={() => setShowGoalModal(true)}
                    className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                  >
                    Suggest Goal
                  </button>
                )}
                {!user?.isPremium && (
                  <Link
                    href="/dashboard/premium"
                    className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg hover:bg-purple-500/20 transition-colors text-sm"
                  >
                    Go Premium
                  </Link>
                )}
              </div>

                {goals.length > 0 ? (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 bg-[#0f1015] rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-red-400" />
                          <h3 className="font-medium text-white">{goal.title}</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{goal.description}</p>
                        
                        {/* Participants */}
                        {goal.participantDetails && goal.participantDetails.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-300 mb-2">Participants:</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {goal.participantDetails.map((participant) => (
                                <div key={participant.uid} className="flex items-center gap-2 bg-[#1a1b1e] rounded-full px-3 py-1">
                                  <Avatar
                                    src={participant.avatarUrl}
                                    alt={`${participant.firstName} ${participant.lastName}`}
                                    size={16}
                                    showBorder={false}
                                  />
                                  <span className="text-xs text-white">
                                    {participant.firstName} {participant.lastName}
                                    {participant.isOwner && ' (You)'}
                                  </span>
                                  {participant.isPremium && <PremiumBadge size="sm" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className={`px-2 py-1 rounded-full ${
                            goal.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            goal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            goal.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {goal.status}
                          </span>
                          <span className="text-gray-500">
                            Due {formatDate(goal.targetDate)}
                          </span>
                        </div>

                        {/* Goal Actions for Standard Users */}
                        {goal.status === 'pending' && goal.createdBy !== user?.uid && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleGoalAction(goal.id, 'accept')}
                              disabled={processingGoal === goal.id}
                              className="flex-1 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                            >
                              {processingGoal === goal.id ? 'Processing...' : 'Accept Goal'}
                            </button>
                            <button
                              onClick={() => handleGoalAction(goal.id, 'decline')}
                              disabled={processingGoal === goal.id}
                              className="flex-1 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                            >
                              {processingGoal === goal.id ? 'Processing...' : 'Decline'}
                            </button>
                          </div>
                        )}

                        {/* Show tips for active goals */}
                        {goal.status === 'active' && goal.tips && goal.tips.length > 0 && (
                          <div className="mt-3 bg-[#1a1b1e] rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-300 mb-2">💡 Tips to succeed:</p>
                            <ul className="text-xs text-gray-400 space-y-1">
                              {goal.tips.slice(0, 3).map((tip, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-400 mt-0.5">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No relationship goals yet</p>
                    {user?.isPremium && members.length > 1 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Suggest a goal to start improving together
                      </p>
                    )}
                    {!user?.isPremium && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Premium members can invite you to work on relationship goals together
                        </p>
                        <p className="text-xs text-gray-600">
                          You'll be notified when you're invited to participate in family goals
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Goal Selection Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1b1e] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Suggest a Relationship Goal</h2>
                <button
                  onClick={() => {
                    setShowGoalModal(false);
                    setSelectedGoal(null);
                    setSelectedMember(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Member Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Select Family Member</h3>
                <div className="grid grid-cols-2 gap-3">
                  {members.filter(m => !m.isOwner).map((member) => (
                    <button
                      key={member.uid}
                      onClick={() => setSelectedMember(member)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedMember?.uid === member.uid
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-700 bg-[#0f1015] hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.avatarUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          size={32}
                        />
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          {member.isPremium && <PremiumBadge size="sm" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Select Goal</h3>
                <div className="space-y-4">
                {PREDEFINED_GOALS.map((goal, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedGoal(goal)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors border-2 ${
                      selectedGoal === goal
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-gray-700 bg-[#0f1015] hover:border-gray-600'
                    }`}
                  >
                    <h3 className="font-medium text-white mb-2">{goal.title}</h3>
                    <p className="text-gray-400 text-sm">{goal.description}</p>
                  </div>
                ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendGoalInvite}
                  disabled={!selectedGoal || !selectedMember || sendingGoal}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingGoal ? 'Sending...' : 'Send Goal Invite'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

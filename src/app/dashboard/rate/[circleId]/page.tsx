'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { standardCircles, isCircleAccessible } from '@/lib/traits-library';
import { CustomCircle, AppUser } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, Users, Crown } from 'lucide-react';

interface CircleMember {
  uid: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isPremium: boolean;
}

export default function SelectMemberPage() {
  const { circleId } = useParams();
  const { user } = useAuthContext();
  const router = useRouter();
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [customCircle, setCustomCircle] = useState<CustomCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const standardCircle = standardCircles[circleId as keyof typeof standardCircles];
  const isStandardCircle = !!standardCircle;

  useEffect(() => {
    // Redirect family circle to family assessment
    if (circleId === 'family') {
      router.push('/dashboard/family-assessment');
      return;
    }

    async function loadMembers() {
      if (!user?.uid || !circleId) return;
      
      setLoading(true);
      setError(null);

      try {
        let circleMembers: CircleMember[] = [];

        // Check if this is a custom circle first
        const customCircleDoc = await getDoc(doc(db, 'customCircles', circleId as string));
        
        if (customCircleDoc.exists()) {
          // Handle custom circle
          const customCircleData = {
            id: customCircleDoc.id,
            ...customCircleDoc.data(),
            createdAt: customCircleDoc.data().createdAt?.toDate(),
            updatedAt: customCircleDoc.data().updatedAt?.toDate()
          } as CustomCircle;
          
          setCustomCircle(customCircleData);
          
          // Load custom circle members
          const membershipsQuery = query(
            collection(db, 'customCircleMemberships'),
            where('circleId', '==', circleId),
            where('status', '==', 'active')
          );
          const membershipsSnapshot = await getDocs(membershipsQuery);
          
          const memberPromises = membershipsSnapshot.docs.map(async (memberDoc) => {
            const membershipData = memberDoc.data();
            const userDoc = await getDoc(doc(db, 'users', membershipData.memberUid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                uid: membershipData.memberUid, // Use memberUid from membership doc
                firstName: userData.firstName,
                lastName: userData.lastName,
                avatarUrl: userData.avatarUrl,
                isPremium: userData.isPremium
              } as CircleMember;
            }
            return null;
          });
          
          const memberResults = (await Promise.all(memberPromises)).filter(Boolean) as CircleMember[];
          
          // Always add the owner to the list first
          const ownerDoc = await getDoc(doc(db, 'users', customCircleData.ownerUid));
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            memberResults.unshift({
              uid: customCircleData.ownerUid,
              firstName: ownerData.firstName,
              lastName: ownerData.lastName,
              avatarUrl: ownerData.avatarUrl,
              isPremium: ownerData.isPremium
            });
          }
          
          // Filter out the current user from being able to rate themselves
          circleMembers = memberResults.filter(member => member.uid !== user.uid);
          
        } else if (isStandardCircle) {
          // Handle standard circle
          if (!isCircleAccessible(circleId as string, user.isPremium)) {
            setError('This circle requires a premium membership.');
            setLoading(false);
            return;
          }

          // Load standard circle members
          const userCirclesQuery = query(
            collection(db, 'userCircles'),
            where('ownerUid', '==', user.uid),
            where('circleId', '==', circleId)
          );
          const userCirclesSnapshot = await getDocs(userCirclesQuery);

          const memberPromises = userCirclesSnapshot.docs.map(async (docSnapshot) => {
            const userCircleData = docSnapshot.data();
            const memberUid = userCircleData.memberUid;

            if (memberUid !== user.uid) {
              const memberDoc = await getDoc(doc(db, 'users', memberUid));
              if (memberDoc.exists()) {
                const memberData = memberDoc.data();
                return {
                  uid: memberUid,
                  firstName: memberData.firstName,
                  lastName: memberData.lastName,
                  avatarUrl: memberData.avatarUrl,
                  isPremium: memberData.isPremium
                } as CircleMember;
              }
            }
            return null;
          });

          circleMembers = (await Promise.all(memberPromises)).filter(Boolean) as CircleMember[];
        } else {
          setError('Circle not found');
          setLoading(false);
          return;
        }

        setMembers(circleMembers);
      } catch (err) {
        console.error('Error loading members:', err);
        setError('Failed to load circle members.');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [circleId, user?.uid, router]);

  if (!user) {
    return null;
  }

  const circleName = customCircle ? customCircle.name : (standardCircle ? standardCircle.name : 'Unknown Circle');
  const circleIcon = customCircle ? customCircle.icon : (standardCircle ? standardCircle.icon : '❓');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-300" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{circleIcon}</span>
            <h1 className="text-3xl font-bold text-white">{circleName}</h1>
            {customCircle && (
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 flex items-center gap-1">
                <Crown className="h-3 w-3 text-purple-400" />
                <span className="text-xs text-purple-300 font-medium">Custom Circle</span>
              </div>
            )}
          </div>
          <p className="text-gray-400">Select a member to rate</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading members...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 border border-gray-700 rounded-xl">
          <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Members Yet</h2>
          <p className="text-gray-400 mb-6">
            {customCircle 
              ? "Invite other users to join your custom circle to start rating." 
              : "Invite other users to your circle to start rating."}
          </p>
          {customCircle && customCircle.ownerUid === user.uid && (
            <Link
              href={`/dashboard/custom-circle/${circleId}`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Circle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Link
              key={member.uid}
              href={`/dashboard/rate/${circleId}/${member.uid}`}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-400/50 hover:bg-gray-800/70 transition-all group"
            >
              <div className="text-center">
                <div className="relative mx-auto mb-4 flex justify-center">
                  <Avatar
                    src={member.avatarUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                    size={80}
                  />
                  {member.isPremium && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full p-1">
                      <Crown className="h-3 w-3 text-yellow-400" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
                  Click to Rate →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
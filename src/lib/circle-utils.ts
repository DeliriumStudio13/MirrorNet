import { db } from './firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';

// Standard circles that should have members (starting with yourself)
export const STANDARD_CIRCLES = ['friends', 'work', 'general', 'family'] as const;

export async function createInitialCircles(userId: string) {
  const batch = writeBatch(db);

  // Create circle stats documents for all circles including eco and attraction
  const allCircles = [...STANDARD_CIRCLES, 'eco', 'attraction'];
  for (const circleId of allCircles) {
    const statsRef = doc(db, 'users', userId, 'circleStats', circleId);
    batch.set(statsRef, {
      count: 0,
      avgScore: 0,
      traits: {},
      updatedAt: new Date(),
    });
  }

  // Only create userCircles documents for standard circles (not eco or attraction)
  for (const circleId of STANDARD_CIRCLES) {
    const userCircleRef = doc(collection(db, 'userCircles'));
    batch.set(userCircleRef, {
      ownerUid: userId,
      memberUid: userId,
      circleId,
      createdAt: new Date(),
    });
  }

  await batch.commit();
}
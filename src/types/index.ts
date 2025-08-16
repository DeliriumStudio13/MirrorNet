export interface AppUser {
  uid: string;
  firstName: string;
  lastName: string;
  firstName_lowercase: string;
  lastName_lowercase: string;
  email: string;
  avatarUrl?: string;
  isPremium: boolean;
  premiumSince?: Date;
  premiumPlan?: string;
  premiumExpires?: Date;
  stripeCustomerId?: string;
  tokens: number;
  premiumTokens: number;  // 3 tokens given when going premium
  createdAt: Date;
  publicProfile: PublicProfile;
}

export interface PublicProfile {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;  // Premium users can create custom circles
  createdBy: string;  // uid of creator
  createdAt: Date;
}

export interface Rating {
  id: string;
  raterUid: string;  // Who gave the rating
  ratedUid: string;  // Who received the rating
  circleId: string;
  scores: Record<string, number>;  // trait name -> score
  isRevealed: boolean;  // For "Attraction" circle - did rater reveal identity
  usedToken: boolean;  // Did this rating use a premium token
  createdAt: Date;
}

export interface RevealRequest {
  id: string;
  fromUid: string;  // Who is requesting the reveal
  toUid: string;    // Who should reveal themselves
  ratingId: string; // Which rating this request is about
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface CircleStats {
  count: number;
  avgScore: number;
  traits: {
    [traitName: string]: {
      sum: number;
      count: number;
      avg: number;
    }
  };
  updatedAt: Date;
}

export interface Invitation {
  id: string;
  fromUid: string;
  toUid: string;
  circleId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface Assessment {
  id: string;
  userId: string;
  traits: Array<{
    name: string;
    score: number;
  }>;
  createdAt: Date;
}

// Custom Circles Interfaces


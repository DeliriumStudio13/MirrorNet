export interface Trait {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface CircleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  traits: string[]; // Array of exactly 5 trait IDs
  isPremiumOnly: boolean;
}

export interface StandardCircle {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultTraits: string[];
  alternativeTraits: string[];
  isPremiumOnly?: boolean;
  isBeta?: boolean;
}

// All available traits organized by circle
export const traits: Record<string, Trait> = {
  // Friends Circle Traits
  loyal: {
    id: 'loyal',
    name: 'Loyal',
    description: 'Sticking by you in good times and bad.',
    category: 'friends'
  },
  honest: {
    id: 'honest',
    name: 'Honest',
    description: 'Telling you the truth, even when it\'s hard.',
    category: 'friends'
  },
  fun: {
    id: 'fun',
    name: 'Fun',
    description: 'Bringing joy and laughter to your life.',
    category: 'friends'
  },
  supportive: {
    id: 'supportive',
    name: 'Supportive',
    description: 'Being there for you with encouragement.',
    category: 'friends'
  },
  goodListener: {
    id: 'goodListener',
    name: 'Good Listener',
    description: 'Paying close attention to what others are saying, without premature judgment.',
    category: 'friends'
  },
  // Friends Alternative Traits (Premium)
  dependable: {
    id: 'dependable',
    name: 'Dependable',
    description: 'Being someone they can always count on.',
    category: 'friends'
  },
  generous: {
    id: 'generous',
    name: 'Generous',
    description: 'Willing to share time, resources, or kindness.',
    category: 'friends'
  },
  empathetic: {
    id: 'empathetic',
    name: 'Empathetic',
    description: 'Understanding and sharing their feelings.',
    category: 'friends'
  },
  respectful: {
    id: 'respectful',
    name: 'Respectful',
    description: 'Valuing their opinions and boundaries.',
    category: 'friends'
  },

  // Work Circle Traits
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Exhibiting a courteous, conscientious, and businesslike manner.',
    category: 'work'
  },
  reliable: {
    id: 'reliable',
    name: 'Reliable',
    description: 'Consistently good in quality or performance; able to be trusted.',
    category: 'work'
  },
  organized: {
    id: 'organized',
    name: 'Organized',
    description: 'Having one\'s affairs in order so as to deal with them efficiently.',
    category: 'work'
  },
  collaborative: {
    id: 'collaborative',
    name: 'Collaborative',
    description: 'Working jointly on an activity, especially to produce or create something.',
    category: 'work'
  },
  punctual: {
    id: 'punctual',
    name: 'Punctual',
    description: 'Happening or doing something at the agreed or proper time.',
    category: 'work'
  },
  // Work Alternative Traits (Premium)
  proactive: {
    id: 'proactive',
    name: 'Proactive',
    description: 'Taking initiative and acting without being told what to do.',
    category: 'work'
  },
  resourceful: {
    id: 'resourceful',
    name: 'Resourceful',
    description: 'Having the ability to find quick and clever ways to overcome difficulties.',
    category: 'work'
  },
  detailOriented: {
    id: 'detailOriented',
    name: 'Detail-Oriented',
    description: 'Paying close attention to all the small particulars.',
    category: 'work'
  },
  leader: {
    id: 'leader',
    name: 'Leader',
    description: 'Inspiring and guiding colleagues towards a common goal.',
    category: 'work'
  },

  // General Circle Traits
  polite: {
    id: 'polite',
    name: 'Polite',
    description: 'Using good manners in conversation.',
    category: 'general'
  },
  friendly: {
    id: 'friendly',
    name: 'Friendly',
    description: 'Being approachable and pleasant.',
    category: 'general'
  },
  trustworthy: {
    id: 'trustworthy',
    name: 'Trustworthy',
    description: 'Being reliable and deserving of confidence.',
    category: 'general'
  },
  openMinded: {
    id: 'openMinded',
    name: 'Open-minded',
    description: 'Willing to consider new ideas; unprejudiced.',
    category: 'general'
  },
  observant: {
    id: 'observant',
    name: 'Observant',
    description: 'Quick to notice things.',
    category: 'general'
  },
  // General Alternative Traits (Premium)
  patient: {
    id: 'patient',
    name: 'Patient',
    description: 'Able to tolerate delays or problems without becoming anxious.',
    category: 'general'
  },
  articulate: {
    id: 'articulate',
    name: 'Articulate',
    description: 'Expressing ideas clearly and effectively.',
    category: 'general'
  },
  curious: {
    id: 'curious',
    name: 'Curious',
    description: 'Eager to know or learn something.',
    category: 'general'
  },
  respectfulGeneral: {
    id: 'respectfulGeneral',
    name: 'Respectful',
    description: 'Showing deference and considering others\' feelings.',
    category: 'general'
  },

  // Family Circle Traits
  caring: {
    id: 'caring',
    name: 'Caring',
    description: 'Showing kindness and concern for others.',
    category: 'family'
  },
  respectfulFamily: {
    id: 'respectfulFamily',
    name: 'Respectful',
    description: 'Feeling or showing deference and respect.',
    category: 'family'
  },
  dependableFamily: {
    id: 'dependableFamily',
    name: 'Dependable',
    description: 'Trustworthy and reliable.',
    category: 'family'
  },
  loving: {
    id: 'loving',
    name: 'Loving',
    description: 'Feeling or showing love or great care.',
    category: 'family'
  },
  protective: {
    id: 'protective',
    name: 'Protective',
    description: 'Having or showing a strong wish to keep someone or something safe from harm.',
    category: 'family'
  },

  // Eco Rating Traits
  energy: {
    id: 'energy',
    name: 'Energy',
    description: 'Mindfulness of energy consumption.',
    category: 'eco'
  },
  waste: {
    id: 'waste',
    name: 'Waste',
    description: 'Commitment to reducing, reusing, and recycling.',
    category: 'eco'
  },
  transport: {
    id: 'transport',
    name: 'Transport',
    description: 'Choosing sustainable transportation methods.',
    category: 'eco'
  },
  consumption: {
    id: 'consumption',
    name: 'Consumption',
    description: 'Making eco-conscious purchasing decisions.',
    category: 'eco'
  },
  water: {
    id: 'water',
    name: 'Water',
    description: 'Conservation of water resources.',
    category: 'eco'
  },

  // Attraction Circle Traits
  appearance: {
    id: 'appearance',
    name: 'Appearance',
    description: 'Their physical attractiveness to you.',
    category: 'attraction'
  },
  charisma: {
    id: 'charisma',
    name: 'Charisma',
    description: 'Their charm and ability to captivate.',
    category: 'attraction'
  },
  humor: {
    id: 'humor',
    name: 'Humor',
    description: 'Their sense of humor and wit.',
    category: 'attraction'
  },
  kindness: {
    id: 'kindness',
    name: 'Kindness',
    description: 'Their compassion and warmth.',
    category: 'attraction'
  },
  intellect: {
    id: 'intellect',
    name: 'Intellect',
    description: 'Their intelligence and stimulating conversation.',
    category: 'attraction'
  },

  // Gaming Clan Traits
  strategic: {
    id: 'strategic',
    name: 'Strategic',
    description: 'Thinks ahead and plans effectively.',
    category: 'gaming'
  },
  teamPlayer: {
    id: 'teamPlayer',
    name: 'Team Player',
    description: 'Collaborates well with others.',
    category: 'gaming'
  },
  goodSport: {
    id: 'goodSport',
    name: 'Good Sport',
    description: 'Handles wins and losses gracefully.',
    category: 'gaming'
  },
  communicativeGaming: {
    id: 'communicativeGaming',
    name: 'Communicative',
    description: 'Shares important information clearly.',
    category: 'gaming'
  },
  reliableGaming: {
    id: 'reliableGaming',
    name: 'Reliable',
    description: 'Is consistently present and prepared for sessions.',
    category: 'gaming'
  },

  // Book Club Traits
  insightful: {
    id: 'insightful',
    name: 'Insightful',
    description: 'Offers deep and thoughtful analysis.',
    category: 'bookClub'
  },
  respectfulListener: {
    id: 'respectfulListener',
    name: 'Respectful Listener',
    description: 'Allows others to share their viewpoints without interruption.',
    category: 'bookClub'
  },
  prepared: {
    id: 'prepared',
    name: 'Prepared',
    description: 'Consistently reads the material and is ready to discuss.',
    category: 'bookClub'
  },
  openMindedBooks: {
    id: 'openMindedBooks',
    name: 'Open-minded',
    description: 'Is receptive to different interpretations and perspectives.',
    category: 'bookClub'
  },
  articulateBooks: {
    id: 'articulateBooks',
    name: 'Articulate',
    description: 'Expresses their thoughts on the book clearly.',
    category: 'bookClub'
  },

  // Gym Buddies Traits
  motivating: {
    id: 'motivating',
    name: 'Motivating',
    description: 'Encourages and pushes you to do your best.',
    category: 'gym'
  },
  punctualGym: {
    id: 'punctualGym',
    name: 'Punctual',
    description: 'Arrives on time for workout sessions.',
    category: 'gym'
  },
  knowledgeable: {
    id: 'knowledgeable',
    name: 'Knowledgeable',
    description: 'Has a good understanding of exercises and form.',
    category: 'gym'
  },
  supportiveSpotter: {
    id: 'supportiveSpotter',
    name: 'Supportive Spotter',
    description: 'Provides reliable and safe spotting.',
    category: 'gym'
  },
  focusedGym: {
    id: 'focusedGym',
    name: 'Focused',
    description: 'Stays on task and avoids excessive distractions during workouts.',
    category: 'gym'
  },

  // Study Group Traits
  punctualStudy: {
    id: 'punctualStudy',
    name: 'Punctual',
    description: 'Arrives on time and prepared for study sessions.',
    category: 'study'
  },
  collaborativeStudy: {
    id: 'collaborativeStudy',
    name: 'Collaborative',
    description: 'Shares notes and helps explain difficult concepts to others.',
    category: 'study'
  },
  focusedStudy: {
    id: 'focusedStudy',
    name: 'Focused',
    description: 'Stays on-task and helps keep the group productive.',
    category: 'study'
  },
  knowledgeableStudy: {
    id: 'knowledgeableStudy',
    name: 'Knowledgeable',
    description: 'Has a strong grasp of the subject matter.',
    category: 'study'
  },
  patientStudy: {
    id: 'patientStudy',
    name: 'Patient',
    description: 'Is willing to take the time to help others understand.',
    category: 'study'
  },

  // Creative Collaborators Traits
  innovative: {
    id: 'innovative',
    name: 'Innovative',
    description: 'Brings new and original ideas to the table.',
    category: 'creative'
  },
  constructiveFeedback: {
    id: 'constructiveFeedback',
    name: 'Constructive Feedback',
    description: 'Provides feedback that is helpful and actionable, not just critical.',
    category: 'creative'
  },
  reliableCreative: {
    id: 'reliableCreative',
    name: 'Reliable',
    description: 'Meets deadlines and delivers on promises.',
    category: 'creative'
  },
  communicativeCreative: {
    id: 'communicativeCreative',
    name: 'Communicative',
    description: 'Clearly expresses their vision and listens to others.',
    category: 'creative'
  },
  openMindedCreative: {
    id: 'openMindedCreative',
    name: 'Open-minded',
    description: 'Is receptive to different artistic styles and approaches.',
    category: 'creative'
  },

  // Roommates Traits
  cleanliness: {
    id: 'cleanliness',
    name: 'Cleanliness',
    description: 'Maintains a tidy and hygienic living space.',
    category: 'roommates'
  },
  respectfulSpace: {
    id: 'respectfulSpace',
    name: 'Respectful of Space',
    description: 'Respects personal boundaries and shared areas.',
    category: 'roommates'
  },
  communicativeRoommate: {
    id: 'communicativeRoommate',
    name: 'Communicative',
    description: 'Openly discusses household issues and plans.',
    category: 'roommates'
  },
  financiallyResponsible: {
    id: 'financiallyResponsible',
    name: 'Financially Responsible',
    description: 'Pays rent and bills on time.',
    category: 'roommates'
  },
  considerate: {
    id: 'considerate',
    name: 'Considerate',
    description: 'Is mindful of noise levels and guest policies.',
    category: 'roommates'
  }
};

// Standard circles
export const standardCircles: Record<string, StandardCircle> = {
  friends: {
    id: 'friends',
    name: 'Friends',
    icon: '👥',
    description: 'Rate and receive feedback from your closest friends',
    defaultTraits: ['loyal', 'honest', 'fun', 'supportive', 'goodListener'],
    alternativeTraits: ['dependable', 'generous', 'empathetic', 'respectful']
  },
  work: {
    id: 'work',
    name: 'Work',
    icon: '💼',
    description: 'Professional feedback from colleagues',
    defaultTraits: ['professional', 'reliable', 'organized', 'collaborative', 'punctual'],
    alternativeTraits: ['proactive', 'resourceful', 'detailOriented', 'leader']
  },
  general: {
    id: 'general',
    name: 'General',
    icon: '🌐',
    description: 'General impressions from your broader network',
    defaultTraits: ['polite', 'friendly', 'trustworthy', 'openMinded', 'observant'],
    alternativeTraits: ['patient', 'articulate', 'curious', 'respectfulGeneral']
  },
  family: {
    id: 'family',
    name: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Feedback from family members',
    defaultTraits: ['caring', 'respectfulFamily', 'dependableFamily', 'loving', 'protective'],
    alternativeTraits: []
  },
  eco: {
    id: 'eco',
    name: 'Eco Rating',
    icon: '🌱',
    description: 'Environmental consciousness rating',
    defaultTraits: ['energy', 'waste', 'transport', 'consumption', 'water'],
    alternativeTraits: [],
    isBeta: true
  },
  attraction: {
    id: 'attraction',
    name: 'Attraction',
    icon: '✨',
    description: 'Rate and receive romantic interest feedback (Premium)',
    defaultTraits: ['appearance', 'charisma', 'humor', 'kindness', 'intellect'],
    alternativeTraits: [],
    isPremiumOnly: true
  }
};

// Custom circle templates (Premium)
export const customCircleTemplates: CircleTemplate[] = [
  {
    id: 'gaming',
    name: 'Gaming Clan',
    description: 'Rate your gaming teammates',
    icon: '🎮',
    traits: ['strategic', 'teamPlayer', 'goodSport', 'communicativeGaming', 'reliableGaming'],
    isPremiumOnly: true
  },
  {
    id: 'bookClub',
    name: 'Book Club',
    description: 'Rate your fellow readers',
    icon: '📚',
    traits: ['insightful', 'respectfulListener', 'prepared', 'openMindedBooks', 'articulateBooks'],
    isPremiumOnly: true
  },
  {
    id: 'gymBuddies',
    name: 'Gym Buddies',
    description: 'Rate your workout partners',
    icon: '💪',
    traits: ['motivating', 'punctualGym', 'knowledgeable', 'supportiveSpotter', 'focusedGym'],
    isPremiumOnly: true
  },
  {
    id: 'studyGroup',
    name: 'Study Group',
    description: 'Rate your study partners',
    icon: '📝',
    traits: ['punctualStudy', 'collaborativeStudy', 'focusedStudy', 'knowledgeableStudy', 'patientStudy'],
    isPremiumOnly: true
  },
  {
    id: 'creativeCollaborators',
    name: 'Creative Collaborators',
    description: 'Rate your creative partners',
    icon: '🎨',
    traits: ['innovative', 'constructiveFeedback', 'reliableCreative', 'communicativeCreative', 'openMindedCreative'],
    isPremiumOnly: true
  },
  {
    id: 'roommates',
    name: 'Roommates',
    description: 'Rate your living space companions',
    icon: '🏠',
    traits: ['cleanliness', 'respectfulSpace', 'communicativeRoommate', 'financiallyResponsible', 'considerate'],
    isPremiumOnly: true
  }
];

// Helper functions
export function getTraitsForCircle(circleId: string): Trait[] {
  const circle = standardCircles[circleId as keyof typeof standardCircles];
  if (!circle) return [];
  return circle.defaultTraits.map(id => traits[id]).filter(Boolean);
}

export function getAlternativeTraitsForCircle(circleId: string): Trait[] {
  const circle = standardCircles[circleId as keyof typeof standardCircles];
  if (!circle || !circle.alternativeTraits) return [];
  return circle.alternativeTraits.map(id => traits[id]).filter(Boolean);
}

export function isCircleAccessible(circleId: string, isPremium: boolean): boolean {
  const circle = standardCircles[circleId as keyof typeof standardCircles];
  if (!circle) return false;
  return !circle.isPremiumOnly || isPremium;
}

export function getCustomCircleTemplate(templateId: string): CircleTemplate | null {
  return customCircleTemplates.find(template => template.id === templateId) || null;
}

// Helper functions for trait management
export function getAllAvailableTraits(): Trait[] {
  return Object.values(traits);
}

export function getTraitsByIds(traitIds: string[]): Trait[] {
  return traitIds.map(id => traits[id]).filter(Boolean);
}

export function getTraitsByCategory(category: string): Trait[] {
  return Object.values(traits).filter(trait => trait.category === category);
}

export function getAllCategories(): string[] {
  const categories = new Set(Object.values(traits).map(trait => trait.category));
  return Array.from(categories);
}

// Get traits available for a specific circle type (for premium trait modification)
export function getAvailableTraitsForCircle(circleId: string): Trait[] {
  // Define which trait categories are appropriate for each circle
  const circleTraitCategories: Record<string, string[]> = {
    friends: ['Personality', 'Social', 'Emotional', 'Lifestyle'],
    work: ['Professional', 'Leadership', 'Collaboration', 'Skills'],
    general: ['Personality', 'Social', 'Values', 'Lifestyle', 'Emotional']
  };
  
  const allowedCategories = circleTraitCategories[circleId] || [];
  return getAllAvailableTraits().filter(trait => 
    allowedCategories.includes(trait.category)
  );
}
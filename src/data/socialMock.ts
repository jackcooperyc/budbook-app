export type Friend = {
  id: string;
  name: string;
  username: string;
  online: boolean;
  sessionsShared: number;
  lastActive: string;
  favoriteStrain?: string;
};

export type Circle = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  recentActivity: string;
};

export const friends: Friend[] = [
  {
    id: 'friend-1',
    name: 'Alex Chen',
    username: 'alexchen',
    online: true,
    sessionsShared: 12,
    lastActive: '2026-04-28T20:10:00-07:00',
    favoriteStrain: 'Blue Dream',
  },
  {
    id: 'friend-2',
    name: 'Morgan Lee',
    username: 'morganl',
    online: false,
    sessionsShared: 8,
    lastActive: '2026-04-27T14:30:00-07:00',
    favoriteStrain: 'GMO Cookies',
  },
  {
    id: 'friend-3',
    name: 'Riley Santos',
    username: 'rsantos',
    online: true,
    sessionsShared: 5,
    lastActive: '2026-04-28T18:45:00-07:00',
    favoriteStrain: 'Jack Herer',
  },
];

export const circles: Circle[] = [
  {
    id: 'circle-1',
    name: 'PDX Evening Wind-Down',
    description: 'Micro-dose logs and sleep hygiene for Portland creatives.',
    memberCount: 14,
    isPrivate: true,
    recentActivity: 'Alex shared a GMO Cookies session · 2h ago',
  },
  {
    id: 'circle-2',
    name: 'CBD-Forward Wellness',
    description: 'Tincture dosing, low-THC experiments, and anxiety tracking.',
    memberCount: 28,
    isPrivate: false,
    recentActivity: 'Morgan posted a Charlotte\'s Web efficacy chart · 5h ago',
  },
  {
    id: 'circle-3',
    name: 'CŪPR Hardware Crew',
    description: 'Vaporizer maintenance, grind consistency, and session prep.',
    memberCount: 9,
    isPrivate: true,
    recentActivity: 'Riley uploaded chamber clean photos · yesterday',
  },
];

export type CannadexEntry = {
  id: string;
  name: string;
  type: 'indica' | 'sativa' | 'hybrid';
  lineage: string;
  typicalEffects: string[];
  bestFor: string;
  thcRange: string;
  cbdRange: string;
  dominantTerpenes: string[];
};

export const cannadexEntries: CannadexEntry[] = [
  {
    id: 'cx-bd',
    name: 'Blue Dream',
    type: 'hybrid',
    lineage: 'Blueberry × Haze',
    typicalEffects: ['Calm', 'Creative', 'Balanced'],
    bestFor: 'Daytime focus with gentle body ease',
    thcRange: '17–24%',
    cbdRange: '<1%',
    dominantTerpenes: ['Myrcene', 'Pinene', 'Caryophyllene'],
  },
  {
    id: 'cx-gmo',
    name: 'GMO Cookies',
    type: 'indica',
    lineage: 'Chemdawg × GSC',
    typicalEffects: ['Heavy body', 'Sedating', 'Euphoric'],
    bestFor: 'Evening pain relief and sleep prep',
    thcRange: '25–32%',
    cbdRange: '<1%',
    dominantTerpenes: ['Caryophyllene', 'Limonene', 'Myrcene'],
  },
  {
    id: 'cx-jh',
    name: 'Jack Herer',
    type: 'sativa',
    lineage: 'Haze × Northern Lights #5 × Shiva Skunk',
    typicalEffects: ['Uplifting', 'Clear-headed', 'Energetic'],
    bestFor: 'Creative sessions — avoid late-day caffeine pairing',
    thcRange: '18–26%',
    cbdRange: '<1%',
    dominantTerpenes: ['Terpinolene', 'Pinene', 'Caryophyllene'],
  },
  {
    id: 'cx-cw',
    name: "Charlotte's Web",
    type: 'hybrid',
    lineage: 'Hemp cultivar (CBD-dominant)',
    typicalEffects: ['Anxiolytic', 'Subtle calm', 'Non-intoxicating'],
    bestFor: 'Mid-day CBD support without sedation',
    thcRange: '<1%',
    cbdRange: '12–20%',
    dominantTerpenes: ['Bisabolol', 'Humulene', 'Linalool'],
  },
];

export const buddyPrompts = [
  'What strain helps me sleep?',
  'Why did my anxiety spike after Jack Herer?',
  'Compare GMO vs Blue Dream for pain',
];

export function getBuddyReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes('sleep') || q.includes('evening')) {
    return 'Your logs show the strongest sleep outcomes with high-myrcene indicas after 8 PM — especially GMO Cookies at 0.18–0.22g via dry-herb vape. Blue Dream works but with lighter sedation.';
  }
  if (q.includes('anxiety') && q.includes('jack')) {
    return 'Session sess-202604261930 flagged anxiety rebound when Jack Herer was paired with espresso within 90 minutes. Try separating caffeine by 2+ hours or switch to a CBD-forward tincture mid-day.';
  }
  if (q.includes('pain') || q.includes('gmo') || q.includes('blue dream')) {
    return 'GMO Cookies shows a median pain delta of −4 vs −2 for Blue Dream in your evening sessions. GMO is heavier; Blue Dream is better when you need mood lift without couch-lock.';
  }
  if (q.includes('low') || q.includes('stash') || q.includes('stock')) {
    return 'You are running low on Blue Dream (~1.2g) and Charlotte\'s Web tincture (<40mg equivalent). Reorder before your next weekend sessions.';
  }
  return 'Based on your journal, evening dry-herb vape sessions between 0.15–0.22g give the most consistent mood and pain improvements. Log pairing notes (caffeine, food) to tighten pattern recognition.';
}

export type LearnItem = {
  id: string;
  title: string;
  type: 'course' | 'ebook' | 'recipe';
  duration: string;
  description: string;
  tag: string;
};

export type MediaItem = {
  id: string;
  title: string;
  source: string;
  type: 'article' | 'podcast' | 'video';
  published: string;
  summary: string;
};

export const learnItems: LearnItem[] = [
  {
    id: 'learn-1',
    title: 'Terpenes 101: Beyond THC%',
    type: 'course',
    duration: '12 min',
    description: 'How myrcene, limonene, and caryophyllene shape your session outcomes.',
    tag: 'Fundamentals',
  },
  {
    id: 'learn-2',
    title: 'Evening Wind-Down Protocol',
    type: 'ebook',
    duration: '24 pages',
    description: 'Micro-dosing, pairing rules, and sleep hygiene for indica-forward routines.',
    tag: 'Wellness',
  },
  {
    id: 'learn-3',
    title: 'CBD Tincture Golden Ratio',
    type: 'recipe',
    duration: '5 min read',
    description: 'Mid-day anxiety support without sedation — dosage ladder included.',
    tag: 'Recipes',
  },
  {
    id: 'learn-4',
    title: 'Vaporizer Chamber Care',
    type: 'course',
    duration: '8 min',
    description: 'Deep-clean cadence for CŪPR and PAX devices to preserve flavor and battery life.',
    tag: 'Hardware',
  },
];

export const mediaItems: MediaItem[] = [
  {
    id: 'media-1',
    title: 'Why Session Journals Beat Strain Names Alone',
    source: 'BudBook Editorial',
    type: 'article',
    published: '2026-04-20',
    summary: 'Efficacy mapping reveals patterns strain labels miss — especially for hybrid SKUs.',
  },
  {
    id: 'media-2',
    title: 'The Micro-Dose Sleep Stack',
    source: 'Wellness Weekly',
    type: 'podcast',
    published: '2026-04-15',
    summary: 'Clinicians discuss myrcene-forward evening protocols and caffeine separation windows.',
  },
  {
    id: 'media-3',
    title: 'Reading a COA Like a Budtender',
    source: 'Lab Signal',
    type: 'video',
    published: '2026-04-08',
    summary: 'Walkthrough of terpene panels, total cannabinoids, and batch variance red flags.',
  },
];

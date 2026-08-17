import { and, count, eq } from 'drizzle-orm';
import { readFile, writeFile, mkdir } from 'fs/promises';
import type { CircleGroup, FriendProfile } from '@/types/pacs';
import { getCurrentUserId } from '@lib/pacs-user/currentUser';
import { dbEnabled, getDb } from '@lib/db/client';
import { circleMembers, circles, friendships, users } from '@lib/db/schema';
import { dataFile, getDataDir } from '@lib/data-dir';

const SOCIAL_FILE = dataFile('local-social.json');

type SocialFile = {
  friends: Record<string, FriendProfile[]>;
  circles: Record<string, CircleGroup[]>;
};

const EMPTY: SocialFile = { friends: {}, circles: {} };

async function ensureSocialFile(): Promise<void> {
  await mkdir(getDataDir(), { recursive: true });
  try {
    await readFile(SOCIAL_FILE, 'utf8');
  } catch {
    await writeFile(SOCIAL_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
  }
}

async function readSocialFile(): Promise<SocialFile> {
  await ensureSocialFile();
  const raw = await readFile(SOCIAL_FILE, 'utf8');
  return JSON.parse(raw) as SocialFile;
}

async function writeSocialFile(data: SocialFile): Promise<void> {
  await ensureSocialFile();
  await writeFile(SOCIAL_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function listFriends(): Promise<FriendProfile[]> {
  const userId = await getCurrentUserId();

  if (!dbEnabled()) {
    const data = await readSocialFile();
    return data.friends[userId] ?? [];
  }

  const db = getDb()!;

  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      username: users.username,
      sessionsShared: friendships.sessionsShared,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(users.id, friendships.friendUserId))
    .where(eq(friendships.userId, userId));

  return rows.map((r) => ({
    id: r.id,
    name: r.fullName,
    username: r.username,
    online: false,
    sessionsShared: r.sessionsShared,
    lastActive: r.createdAt.toISOString(),
    favoriteStrain: undefined,
  }));
}

export async function listCircles(): Promise<CircleGroup[]> {
  const userId = await getCurrentUserId();

  if (!dbEnabled()) {
    const data = await readSocialFile();
    return data.circles[userId] ?? [];
  }

  const db = getDb()!;

  const rows = await db
    .select({
      id: circles.id,
      name: circles.name,
      description: circles.description,
      isPrivate: circles.isPrivate,
      recentActivity: circles.recentActivity,
      memberCount: count(circleMembers.userId),
    })
    .from(circles)
    .innerJoin(circleMembers, eq(circleMembers.circleId, circles.id))
    .where(eq(circleMembers.userId, userId))
    .groupBy(
      circles.id,
      circles.name,
      circles.description,
      circles.isPrivate,
      circles.recentActivity,
    );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    memberCount: Number(r.memberCount),
    isPrivate: r.isPrivate,
    recentActivity: r.recentActivity,
  }));
}

export async function createCircle(input: {
  name: string;
  description?: string;
  isPrivate?: boolean;
}): Promise<CircleGroup> {
  const userId = await getCurrentUserId();
  const id = `circle-${Date.now()}`;
  const circle: CircleGroup = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    memberCount: 1,
    isPrivate: input.isPrivate ?? false,
    recentActivity: 'Circle created',
  };

  if (!dbEnabled()) {
    const data = await readSocialFile();
    const list = data.circles[userId] ?? [];
    data.circles[userId] = [circle, ...list];
    await writeSocialFile(data);
    return circle;
  }

  const db = getDb()!;
  await db.insert(circles).values({
    id,
    ownerId: userId,
    name: circle.name,
    description: circle.description,
    isPrivate: circle.isPrivate,
    recentActivity: circle.recentActivity,
  });
  await db.insert(circleMembers).values({ circleId: id, userId });

  return circle;
}

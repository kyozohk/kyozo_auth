'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define interfaces for the data shapes
export interface Community {
    id: string;
    name: string;
    communityProfileImage?: string;
    memberCount: number;
    data: any;
}

export interface Member {
    id: string;
    uid?: string;
    displayName?: string;
    photoURL?: string;
    email?: string;
    phoneNumber?: string;
    joinedAt?: string;
    role: 'owner' | 'admin' | 'member';
    data: any;
}

export interface Message {
    id: string;
    text: string;
    createdAt: string;
    sender: {
        id: string;
        uid?: string;
        displayName?: string;
        photoURL?: string;
        email?: string;
        data: any;
    };
    data: any;
}

// Re-export for client-side usage
export type { Community as CommunityType, Member as MemberType, Message as MessageType };


export async function getCommunities(): Promise<Community[]> {
  try {
    const db = await connectToDatabase();
    const communities = await db
      .collection('communities')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return communities.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      communityProfileImage: c.communityProfileImage,
      memberCount: c.usersList?.length || 0,
      data: JSON.parse(JSON.stringify(c)), // Serialize for client
    }));
  } catch (error) {
    console.error('Failed to get communities:', error);
    return [];
  }
}

export async function getMembers(communityId: string): Promise<Member[]> {
  if (!communityId) return [];
  try {
    const db = await connectToDatabase();
    
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });

    if (!community || !community.usersList) {
      return [];
    }
    
    // Filter out any potential null/undefined userIds before mapping
    const userOids = community.usersList
        .map((user: any) => user.userId)
        .filter(Boolean) 
        .map((id: any) => new ObjectId(id));

    const userJoinDates: {[key: string]: string} = {};
    community.usersList.forEach((user: any) => {
        if(user.userId && user.joinedAt) {
            userJoinDates[user.userId.toString()] = user.joinedAt?.toISOString();
        }
    });

    const communityOwnerId = community.owner?.toString();
    const adminIds = (community.communityHandles || [])
        .filter((handle: any) => handle.role === 'cl' || handle.role === 'admin')
        .map((handle: any) => handle.userId.toString());


    const users = await db
      .collection('users')
      .find({ _id: { $in: userOids } })
      .project({ _id: 1, uid: 1, displayName: 1, photoURL: 1, email: 1, fullName: 1, profileImage: 1, phoneNumber: 1, firebaseUid: 1 })
      .limit(100) // Let's increase the limit a bit
      .toArray();

    return users.map((u: any) => {
        const userIdString = u._id.toString();
        let role: 'owner' | 'admin' | 'member' = 'member';
        if (userIdString === communityOwnerId) {
            role = 'owner';
        } else if (adminIds.includes(userIdString)) {
            role = 'admin';
        }

        return {
            id: userIdString,
            uid: u.uid || u.firebaseUid,
            displayName: u.displayName || u.fullName,
            photoURL: u.photoURL || u.profileImage,
            email: u.email,
            phoneNumber: u.phoneNumber,
            joinedAt: userJoinDates[userIdString],
            role,
            data: JSON.parse(JSON.stringify(u)),
        }
    });
  } catch (error) {
    console.error(`Failed to get members for community ${communityId}:`, error);
    return [];
  }
}

export async function getMessagesForMember(communityId: string, memberId: string): Promise<Message[]> {
  if (!communityId || !memberId) return [];
  try {
    const db = await connectToDatabase();
    const memberObjectId = new ObjectId(memberId);
    const communityObjectId = new ObjectId(communityId);

    const channel = await db.collection('channels').findOne({
      user: memberObjectId,
      community: communityObjectId,
    });

    if (!channel) {
      return [];
    }

    const messagesFromDb: any[] = await db.collection('messages').aggregate([
      { $match: { channel: channel._id } },
      { $sort: { createdAt: 1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      { $unwind: { path: '$senderInfo', preserveNullAndEmptyArrays: true } }
    ]).toArray();

    return messagesFromDb.map((m: any) => {
      const senderInfo = m.senderInfo || {};
      return {
        id: m._id.toString(),
        text: m.text,
        createdAt: m.createdAt.toISOString(),
        sender: {
          id: senderInfo._id?.toString() || m.user?.toString() || 'unknown',
          uid: senderInfo.uid,
          displayName: senderInfo.displayName || senderInfo.fullName || 'Unknown Sender',
          photoURL: senderInfo.photoURL || senderInfo.profileImage,
          email: senderInfo.email,
          data: JSON.parse(JSON.stringify(senderInfo)),
        },
        data: JSON.parse(JSON.stringify(m)),
      };
    });
  } catch (error) {
    console.error(`Failed to get messages for member ${memberId} in community ${communityId}:`, error);
    return [];
  }
}

'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define interfaces for the data shapes
export interface Community {
    _id: string;
    name: string;
    communityProfileImage?: string;
    usersList: Member[];
}

export interface Member {
    userId: string;
    email?: string; // It seems email is not always present
    [key: string]: any;
}

export interface UserProfile {
    _id: string;
    id: string;
    name?: string;
    lastName?: string;
    email: string;
    profileImage?: string;
}

export interface Channel {
    _id: string;
    community: string;
    users: string[];
    user: string;
}

export interface Message {
    _id: string;
    channel: string;
    sender: string;
    text: string;
    createdAt: Date;
}

// Re-export for client-side usage
export type { Community as CommunityType, Member as MemberType, Message as MessageType, UserProfile as UserProfileType };


export async function getCommunities(): Promise<Community[]> {
    const db = await connectToDatabase();
    const communities = await db.collection('communities').find({}).limit(50).toArray();
    
    // Convert non-serializable BSON types to plain objects for the client.
    // A simple round-trip through JSON.stringify/parse handles most BSON types from the driver.
    return JSON.parse(JSON.stringify(communities));
}


export async function getCommunityMembers(communityId: string): Promise<{ members: Member[], profiles: Record<string, UserProfile> }> {
    const db = await connectToDatabase();
    const communityObjectId = new ObjectId(communityId);

    // Find the community to get the usersList
    const community = await db.collection('communities').findOne({ _id: communityObjectId });

    if (!community || !community.usersList) {
        return { members: [], profiles: {} };
    }

    const members = JSON.parse(JSON.stringify(community.usersList)) as Member[];
    const userIds = members.map(m => m.userId).filter(Boolean);

    // Fetch profiles from both 'users' and 'Users' collections
    const usersQuery = userIds.length > 0 ? db.collection('users').find({ id: { $in: userIds } }).toArray() : Promise.resolve([]);
    const upperUsersQuery = userIds.length > 0 ? db.collection('Users').find({ id: { $in: userIds } }).toArray() : Promise.resolve([]);
    
    const [userDocs, upperUserDocs] = await Promise.all([usersQuery, upperUsersQuery]);
    
    const profiles: Record<string, UserProfile> = {};

    const processDocs = (docs: any[]) => {
        for (const doc of docs) {
            // Convert to plain object and handle ObjectId
            const plainDoc = JSON.parse(JSON.stringify(doc));
            const profile = { ...plainDoc, _id: plainDoc._id.toString() } as UserProfile;
            if (doc.id && !profiles[doc.id]) {
                profiles[doc.id] = profile;
            }
        }
    }

    processDocs(userDocs);
    processDocs(upperUserDocs);

    return { members, profiles };
}

export async function getMessages(communityId: string, currentUserId: string, selectedUserId: string): Promise<Message[]> {
    const db = await connectToDatabase();
    const communityObjectId = new ObjectId(communityId);
  
    // 1. Find the channel connecting the two users within the community
    // This is a simplified version. A real implementation might need more robust logic
    // to handle cases where multiple channels could exist.
    const channel = await db.collection('channels').findOne({
      community: communityObjectId,
      // Check both directions for the user pair
      $or: [
        { users: { $all: [currentUserId, selectedUserId] } },
        // This logic might need to be adapted based on how `users` array is stored
      ]
    });

    if (!channel) {
      // Also check where user field is the selectedUserId
      const userChannel = await db.collection('channels').findOne({
        community: communityObjectId,
        user: selectedUserId,
      });
      if(!userChannel) return [];

      const messagesForUserChannel = await db.collection('messages')
        .find({ channel: userChannel._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      // Convert to plain objects before returning
      return JSON.parse(JSON.stringify(messagesForUserChannel));
    }
  
    // 2. Fetch messages for that channel
    const messages = await db.collection('messages')
      .find({ channel: channel._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
      
    // Convert to plain objects before returning
    return JSON.parse(JSON.stringify(messages));
}

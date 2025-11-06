'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define interfaces for the data shapes
export interface Community {
    id: string;
    name: string;
    communityProfileImage?: string;
    usersList: Member[];
    [key: string]: any;
}

export interface Member {
    userId: string;
    email?: string;
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
    
    // Convert to plain objects for the client, ensuring all ObjectIds are strings
    return JSON.parse(JSON.stringify(communities));
}


export async function getCommunityMembers(communityId: string): Promise<{ members: Member[], profiles: Record<string, UserProfile> }> {
    const db = await connectToDatabase();
    const communityObjectId = new ObjectId(communityId);

    const community = await db.collection('communities').findOne({ _id: communityObjectId });

    if (!community || !community.usersList) {
        return { members: [], profiles: {} };
    }

    const members = JSON.parse(JSON.stringify(community.usersList)) as Member[];
    
    // The userIds in usersList are strings that need to be converted to ObjectIds for the query
    const userOids = members.map(m => m.userId).filter(Boolean).map(id => new ObjectId(id));
    
    const profiles: Record<string, UserProfile> = {};

    if (userOids.length > 0) {
        const userDocs = await db.collection('users').find({ _id: { $in: userOids } }).toArray();

        for (const doc of userDocs) {
            const plainDoc = JSON.parse(JSON.stringify(doc));
            const profile = { ...plainDoc, _id: plainDoc._id.toString(), id: plainDoc._id.toString() } as UserProfile;
            // Use the original string userId from the members array as the key
            const originalUserId = members.find(m => m.userId === profile._id)?.userId;
            if (originalUserId) {
                profiles[originalUserId] = profile;
            }
        }
    }
    
    return { members, profiles };
}

export async function getMessages(communityId: string, currentUserId: string, selectedUserId: string): Promise<Message[]> {
    const db = await connectToDatabase();
    
    // Find the channel that includes the selected member
    const channel = await db.collection('channels').findOne({
      community: new ObjectId(communityId),
      user: new ObjectId(selectedUserId)
    });

    if (!channel) {
      return [];
    }
  
    // Fetch messages for that channel
    const messages = await db.collection('messages')
      .find({ channel: channel._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
      
    // Convert to plain objects before returning
    return JSON.parse(JSON.stringify(messages));
}

'use server';

import { firestore } from '@/lib/firebase-admin';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase-admin/firestore';

// --- Firestore Types ---
export interface Community {
    id: string;
    name: string;
    usersList?: { userId: string }[];
    data?: any;
}
export interface Member {
    id: string; // This is the user's UID
    displayName?: string;
    email?: string;
    photoURL?: string;
    data?: any;
}
export interface Message {
    id: string;
    text: string;
    createdAt: string;
    sender: string; // UID of sender
    data?: any;
}

// --- MongoDB Types ---
export interface CommunityMongo {
    id: string;
    name: string;
    memberCount: number;
    data?: any;
}
export interface MemberMongo {
    id: string;
    uid?: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
    data?: any;
}
export interface MessageMongo {
    id:string;
    text: string;
    createdAt: string;
    sender: {
        id: string;
        uid?: string;
        displayName?: string;
        photoURL?: string;
    }
    data?: any;
}


// --- Firestore Actions ---

export async function getCommunities(): Promise<Community[]> {
    const db = getFirestore();
    const snapshot = await db.collection('communities').where('name', '==', 'Digital Art Fair').get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        usersList: doc.data().usersList,
        data: doc.data()
    }));
}

async function getUserProfile(db: FirebaseFirestore.Firestore, userId: string): Promise<Member | null> {
    if (!userId) return null;
    try {
        let userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const data = userDoc.data()!;
            return { id: userDoc.id, displayName: data.displayName || data.name, email: data.email, photoURL: data.photoURL || data.profileImage, data };
        }
        userDoc = await db.collection('Users').doc(userId).get();
        if (userDoc.exists) {
            const data = userDoc.data()!;
            return { id: userDoc.id, displayName: data.displayName || data.name, email: data.email, photoURL: data.photoURL || data.profileImage, data };
        }
        return null;
    } catch (e) {
        console.error(`Error fetching profile for ${userId}`, e);
        return null;
    }
}


export async function getMembers(communityId: string): Promise<Member[]> {
    if (!communityId) return [];
    const db = getFirestore();
    const communityDoc = await db.collection('communities').doc(communityId).get();
    if (!communityDoc.exists) return [];

    const communityData = communityDoc.data();
    const usersList = communityData?.usersList || [];

    const memberPromises = usersList.map((member: { userId: string }) => getUserProfile(db, member.userId));
    const members = await Promise.all(memberPromises);

    return members.filter((m): m is Member => m !== null);
}

export async function getMessagesForMember(communityId: string, memberId: string): Promise<Message[]> {
    if (!communityId || !memberId) return [];
    const db = getFirestore();
    
    const channelsRef = db.collection('channels');
    const q = query(
        channelsRef,
        where('community', '==', communityId),
        where('users', 'array-contains', memberId)
    );

    const channelsSnap = await getDocs(q as any);
    
    // Find the specific 1-on-1 channel
    let channelId: string | null = null;
    for (const doc of channelsSnap.docs) {
        const data = doc.data();
        if (data.users.length === 2 && data.users.includes(memberId)) { // Assuming current user is other person
            channelId = doc.id;
            break;
        }
    }

    if (!channelId) return [];
    
    const messagesRef = db.collection('messages');
    const messagesQuery = query(
        messagesRef,
        where('channel', '==', channelId),
        orderBy('createdAt', 'asc'),
        limit(100)
    );

    const messagesSnap = await getDocs(messagesQuery as any);
    return messagesSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            text: data.text,
            createdAt: data.createdAt.toDate().toISOString(),
            sender: data.sender,
            data: data
        }
    });
}


// --- MongoDB Actions ---

export async function getCommunitiesMongo(): Promise<CommunityMongo[]> {
  try {
    const db = await connectToDatabase();
    const communities = await db.collection('communities').find({ name: 'Digital Art Fair' }).toArray();
    return communities.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      memberCount: c.usersList?.length || 0,
      data: JSON.parse(JSON.stringify(c)),
    }));
  } catch (error) {
    console.error('Failed to get mongo communities:', error);
    return [];
  }
}

export async function getMembersMongo(communityId: string): Promise<MemberMongo[]> {
  if (!communityId) return [];
  try {
    const db = await connectToDatabase();
    const community = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });
    if (!community || !community.usersList) return [];
    
    const userOids = community.usersList.map((user: any) => user.userId).filter(Boolean).map((id: any) => new ObjectId(id));
    const users = await db.collection('users').find({ _id: { $in: userOids } }).toArray();

    return users.map((u: any) => ({
        id: u._id.toString(),
        uid: u.uid || u.firebaseUid,
        displayName: u.displayName || u.fullName,
        photoURL: u.photoURL || u.profileImage,
        email: u.email,
        data: JSON.parse(JSON.stringify(u)),
    }));
  } catch (error) {
    console.error(`Failed to get mongo members for ${communityId}:`, error);
    return [];
  }
}

export async function getMessagesForMemberMongo(communityId: string, memberId: string): Promise<MessageMongo[]> {
  if (!communityId || !memberId) return [];
  try {
    const db = await connectToDatabase();
    const memberObjectId = new ObjectId(memberId);
    const communityObjectId = new ObjectId(communityId);

    const channel = await db.collection('channels').findOne({
      user: memberObjectId,
      community: communityObjectId,
    });

    if (!channel) return [];

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
        },
        data: JSON.parse(JSON.stringify(m)),
      };
    });
  } catch (error) {
    console.error(`Failed to get mongo messages for member ${memberId}:`, error);
    return [];
  }
}

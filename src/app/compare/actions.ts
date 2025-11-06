'use server';

import { firestore } from '@/lib/firebase-admin';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// --- Firestore Data Fetching ---

export interface FirestoreCommunityWithMembers {
    id: string;
    members: any[];
    [key: string]: any;
}

async function getFirestoreUser(userId: string): Promise<any | null> {
    if (!userId) return null;

    try {
        // 1. Try to get user by document ID (if userId is a Firebase UID)
        let userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return { id: userDoc.id, ...userDoc.data() };
        }
        userDoc = await firestore.collection('Users').doc(userId).get();
         if (userDoc.exists) {
            return { id: userDoc.id, ...userDoc.data() };
        }

        // 2. Query for user where 'originalMongoId' field matches the userId from community
        let userQuery = await firestore.collection('users').where('originalMongoId', '==', userId).limit(1).get();
        if (!userQuery.empty) {
            const doc = userQuery.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        userQuery = await firestore.collection('Users').where('originalMongoId', '==', userId).limit(1).get();
        if (!userQuery.empty) {
            const doc = userQuery.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        // 3. Fallback: Query where 'id' field matches (as was originally tried)
        userQuery = await firestore.collection('users').where('id', '==', userId).limit(1).get();
        if (!userQuery.empty) {
            const doc = userQuery.docs[0];
            return { id: doc.id, ...doc.data() };
        }
         userQuery = await firestore.collection('Users').where('id', '==', userId).limit(1).get();
        if (!userQuery.empty) {
            const doc = userQuery.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        console.warn(`Firestore user not found for ID: ${userId}`);
        return null;

    } catch (error) {
        console.error(`Error fetching Firestore user ${userId}:`, error);
        return { id: userId, error: 'Not Found' };
    }
}


export async function getFirestoreCommunitiesWithMembers(): Promise<FirestoreCommunityWithMembers[]> {
    try {
        const communitiesSnapshot = await firestore.collection('communities').where('name', '==', 'Souta').limit(1).get();
        if (communitiesSnapshot.empty) {
            return [];
        }

        const communitiesWithMembers = await Promise.all(
            communitiesSnapshot.docs.map(async (doc) => {
                const communityData = doc.data();
                const communityId = doc.id;
                let members: any[] = [];

                if (communityData.usersList && Array.isArray(communityData.usersList)) {
                    const memberPromises = communityData.usersList.map((member: any) => 
                        getFirestoreUser(member.userId)
                    );
                    members = (await Promise.all(memberPromises)).filter(m => m !== null);
                }

                return {
                    ...communityData,
                    id: communityId,
                    members: members,
                };
            })
        );
        
        return JSON.parse(JSON.stringify(communitiesWithMembers));

    } catch (error) {
        console.error('Failed to get Firestore communities with members:', error);
        return [];
    }
}


// --- MongoDB Data Fetching ---

export interface MongoCommunityWithMembers {
    id: string;
    members: any[];
    [key: string]: any;
}

export async function getMongoCommunitiesWithMembers(): Promise<MongoCommunityWithMembers[]> {
    try {
        const db = await connectToDatabase();
        const communities = await db
            .collection('communities')
            .find({ name: 'Souta' })
            .limit(1)
            .toArray();

        if (communities.length === 0) return [];

        const communitiesWithMembers = await Promise.all(
            communities.map(async (community) => {
                const communityId = community._id.toString();
                let members: any[] = [];

                 if (community.usersList && Array.isArray(community.usersList)) {
                    const userOids = community.usersList
                        .map((user: any) => {
                            try {
                                return new ObjectId(user.userId)
                            } catch (e) {
                                return null;
                            }
                        })
                        .filter((id: any) => id); // Filter out null/undefined IDs

                    if (userOids.length > 0) {
                        const fetchedUsers = await db
                            .collection('users')
                            .find({ _id: { $in: userOids } })
                            .toArray();
                        members = fetchedUsers;
                    }
                }

                return {
                    ...community,
                    id: communityId,
                    _id: communityId, // ensure _id is a string
                    members: members,
                };
            })
        );

        return JSON.parse(JSON.stringify(communitiesWithMembers));

    } catch (error) {
        console.error('Failed to get MongoDB communities with members:', error);
        return [];
    }
}

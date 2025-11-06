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
        // Firestore user IDs are typically the document ID, so we use .doc().get()
        const userDocRef = firestore.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            return { id: userDoc.id, ...userDoc.data() };
        }

        // As a fallback, check the 'Users' collection as well
        const upperUserDocRef = firestore.collection('Users').doc(userId);
        const upperUserDoc = await upperUserDocRef.get();
        if (upperUserDoc.exists) {
            return { id: upperUserDoc.id, ...upperUserDoc.data() };
        }

        // Fallback query if the document ID is not the UID
        const userQuery = await firestore.collection('users').where('id', '==', userId).limit(1).get();
        if (!userQuery.empty) {
            const doc = userQuery.docs[0];
            return { id: doc.id, ...doc.data() };
        }

        const upperUserQuery = await firestore.collection('Users').where('id', '==', userId).limit(1).get();
        if (!upperUserQuery.empty) {
            const doc = upperUserQuery.docs[0];
            return { id: doc.id, ...doc.data() };
        }

    } catch (error) {
        console.error(`Error fetching Firestore user ${userId}:`, error);
    }
    return { id: userId, error: 'Not Found' };
}


export async function getFirestoreCommunitiesWithMembers(): Promise<FirestoreCommunityWithMembers[]> {
    try {
        const communitiesSnapshot = await firestore.collection('communities').get();
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
        
        // A simple way to ensure serializability
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
            .find({})
            .sort({ name: 1 })
            .toArray();

        const communitiesWithMembers = await Promise.all(
            communities.map(async (community) => {
                const communityId = community._id.toString();
                let members: any[] = [];

                 if (community.usersList && Array.isArray(community.usersList)) {
                    const userOids = community.usersList
                        .map((user: any) => user.userId)
                        .filter(Boolean); // Filter out null/undefined IDs

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

        // Deep serialization to handle all BSON types
        return JSON.parse(JSON.stringify(communitiesWithMembers));

    } catch (error) {
        console.error('Failed to get MongoDB communities with members:', error);
        return [];
    }
}

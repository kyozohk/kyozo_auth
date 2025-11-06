'use server';

import { firestore } from '@/lib/firebase-admin';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuth } from 'firebase-admin/auth';

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
                                // The userId from usersList is already a string of the ObjectId
                                return new ObjectId(user.userId)
                            } catch (e) {
                                console.error(`Invalid ObjectId format for userId: ${user.userId}`);
                                return null;
                            }
                        })
                        .filter((id: any) => id); // Filter out null/invalid IDs

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
                    _id: communityId,
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

// --- Data Synchronization Action ---
export async function fixAndSyncCommunity(communityId: string): Promise<{success: boolean, message: string}> {
    if (!communityId) {
        return { success: false, message: 'Community ID is required.' };
    }

    try {
        const db = await connectToDatabase();
        const mongoCommunity = await db.collection('communities').findOne({ _id: new ObjectId(communityId) });

        if (!mongoCommunity) {
            throw new Error(`Community with ID ${communityId} not found in MongoDB.`);
        }

        if (!mongoCommunity.usersList || !Array.isArray(mongoCommunity.usersList)) {
            return { success: true, message: 'Community has no members in MongoDB. Nothing to sync.' };
        }
        
        const newUsersList = [];
        const auth = getAuth();

        for (const member of mongoCommunity.usersList) {
            const mongoUserId = member.userId;
            const mongoUser = await db.collection('users').findOne({ _id: new ObjectId(mongoUserId) });
            
            if (!mongoUser || !mongoUser.email) {
                console.warn(`Skipping member with Mongo ID ${mongoUserId} - no user record or email found.`);
                continue;
            }

            try {
                // Find the user in Firebase Auth by their email
                const firebaseUserRecord = await auth.getUserByEmail(mongoUser.email);
                
                // Create a serializable member object, converting ObjectIds to strings
                const newMemberObject = {
                    ...member,
                    userId: firebaseUserRecord.uid, // The CRITICAL CHANGE: use Firebase UID
                    email: mongoUser.email,
                };
                
                // Specifically check for and convert referralId if it's an ObjectId
                if (newMemberObject.referralId && newMemberObject.referralId instanceof ObjectId) {
                    newMemberObject.referralId = newMemberObject.referralId.toString();
                }

                newUsersList.push(newMemberObject);

            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    console.warn(`User with email ${mongoUser.email} (Mongo ID: ${mongoUserId}) not found in Firebase Auth. Skipping.`);
                } else {
                    console.error(`Error fetching Firebase user for email ${mongoUser.email}:`, error);
                }
            }
        }
        
        // Update the document in Firestore
        const communityRef = firestore.collection('communities').doc(communityId);
        await communityRef.update({
            usersList: newUsersList
        });

        return { success: true, message: `Successfully synced ${newUsersList.length} members for community "${mongoCommunity.name}".` };

    } catch (error: any) {
        console.error('Failed to sync community:', error);
        return { success: false, message: error.message || 'An unknown error occurred during sync.' };
    }
}

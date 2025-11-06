'use server';

import { firestore } from '@/lib/firebase-admin';

export async function getUsers(): Promise<any[]> {
  const usersRef = firestore.collection('users');
  const snapshot = await usersRef.get();
  if (snapshot.empty) {
    // Let's add some dummy data if the collection is empty
    const batch = firestore.batch();
    const dummyUsers = [
        { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
        { name: 'Bob', email: 'bob@example.com', role: 'User' },
        { name: 'Charlie', email: 'charlie@example.com', role: 'User' }
    ];
    dummyUsers.forEach(user => {
        const docRef = usersRef.doc(); // Automatically generate document ID
        batch.set(docRef, user);
    });
    await batch.commit();
    const newSnapshot = await usersRef.get();
    return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

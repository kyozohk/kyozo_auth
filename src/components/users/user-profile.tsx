'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useEffect, useMemo } from 'react';

interface UserProfileData {
  id: string;
  name: string;
  lastName?: string;
  email: string;
  profileImage?: string;
}

interface UserProfileProps {
  userId: string;
  onSelect: (userId: string, userName: string) => void;
  isSelected?: boolean;
  onProfileLoad?: (userId: string, name: string, email: string) => void;
}

export function UserProfile({ userId, onSelect, isSelected, onProfileLoad }: UserProfileProps) {
  const firestore = useFirestore();

  // Query 'users' collection where 'id' field == userId
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'users'), where('id', '==', userId), limit(1));
  }, [userId, firestore]);
  const { data: usersResult, isLoading: isLoadingUsers } = useCollection<UserProfileData>(usersQuery);

  // Query 'Users' collection where 'id' field == userId
  const upperUsersQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'Users'), where('id', '==', userId), limit(1));
  }, [userId, firestore]);
  const { data: upperUsersResult, isLoading: isLoadingUpperUsers } = useCollection<UserProfileData>(upperUsersQuery);

  const user = useMemo(() => {
    if (usersResult && usersResult.length > 0) return usersResult[0];
    if (upperUsersResult && upperUsersResult.length > 0) return upperUsersResult[0];
    return null;
  }, [usersResult, upperUsersResult]);
  
  const isLoading = isLoadingUsers || isLoadingUpperUsers;

  const fullName = user ? `${user.name || ''} ${user.lastName || ''}`.trim() || user.email || 'Unnamed User' : 'Loading...';

  useEffect(() => {
    if (user && onProfileLoad) {
      onProfileLoad(userId, fullName, user.email || '');
    }
  }, [user, userId, fullName, onProfileLoad]);


  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 p-3 w-full">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex items-center space-x-4 p-3 opacity-50 w-full">
            <Avatar>
            <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div>
            <p className="font-semibold">Unknown User</p>
            <p className="text-sm text-muted-foreground">{userId}</p>
            </div>
        </div>
    );
  }
  
  const fallback = ((user.name?.[0] ?? '') + (user.lastName?.[0] ?? '')).trim() || 'U';

  return (
    <Button
      variant={isSelected ? 'secondary' : 'ghost'}
      className="flex h-auto w-full items-center justify-start p-3"
      onClick={() => onSelect(userId, fullName)}
    >
      <div className="flex items-center space-x-3 text-left">
        <Avatar>
          <AvatarImage src={user.profileImage} alt={fullName} />
          <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold truncate">{fullName}</p>
          {user.email && <p className="text-sm text-muted-foreground truncate">{user.email}</p>}
        </div>
      </div>
    </Button>
  );
}

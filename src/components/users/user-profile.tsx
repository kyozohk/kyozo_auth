'use client';

import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useEffect, useMemo } from 'react';

interface UserProfileData {
  id: string; // This should be the Firebase UID
  name?: string;
  lastName?: string;
  displayName?: string;
  email: string;
  profileImage?: string;
  photoURL?: string;
  [key: string]: any; // Allow other properties
}

interface UserProfileProps {
  userId: string; // Expecting Firebase UID
  onSelect: (userId: string, userName:string) => void;
  isSelected?: boolean;
  onProfileLoad?: (userId: string, profile: UserProfileData) => void;
}

export function UserProfile({ userId, onSelect, isSelected, onProfileLoad }: UserProfileProps) {
  const firestore = useFirestore();

  // Try to fetch from 'users' collection
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [userId, firestore]);
  const { data: user, isLoading, error: userError } = useDoc<UserProfileData>(userDocRef);

  // Always try to fetch from 'Users' collection as a fallback
  const upperUserDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'Users', userId);
  },[userId, firestore]);
  const { data: upperUser, isLoading: isLoadingUpper, error: upperUserError } = useDoc<UserProfileData>(upperUserDocRef);

  // Determine the final user data and loading state
  const finalUser = user || upperUser;
  const finalIsLoading = (isLoading && !upperUser) || (isLoadingUpper && !user);
  
  const fullName = useMemo(() => {
     if (finalIsLoading) return 'Loading...';
     if (!finalUser) return 'User Not Found';
     return finalUser.displayName || `${finalUser.name || ''} ${finalUser.lastName || ''}`.trim() || finalUser.email || 'Unnamed User';
  }, [finalUser, finalIsLoading])


  useEffect(() => {
    if (finalUser && onProfileLoad) {
      onProfileLoad(userId, finalUser);
    }
  }, [finalUser, userId, onProfileLoad]);


  if (finalIsLoading) {
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

  if (!finalUser) {
    return (
        <div className="flex items-center space-x-4 p-3 opacity-50 w-full">
            <Avatar>
            <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div>
            <p className="font-semibold text-destructive">User Not Found</p>
            <p className="text-xs text-muted-foreground">{userId}</p>
            </div>
        </div>
    );
  }
  
  const fallbackName = finalUser.name || finalUser.displayName || '';
  const fallback = ((fallbackName?.[0] ?? '') + (finalUser.lastName?.[0] ?? '')).trim() || 'U';

  return (
    <Button
      variant={isSelected ? 'secondary' : 'ghost'}
      className="flex h-auto flex-1 items-center justify-start p-3"
      onClick={() => onSelect(userId, fullName)}
    >
      <div className="flex items-center space-x-3 text-left">
        <Avatar>
          <AvatarImage src={finalUser.profileImage || finalUser.photoURL} alt={fullName} />
          <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className='flex-1 truncate'>
          <p className="font-semibold truncate">{fullName}</p>
          {finalUser.email && <p className="text-sm text-muted-foreground truncate">{finalUser.email}</p>}
        </div>
      </div>
    </Button>
  );
}

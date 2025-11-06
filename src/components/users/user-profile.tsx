'use client';

import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserProfileData {
  name: string;
  lastName: string;
  email: string;
}

interface UserProfileProps {
  userId: string;
  onSelect: (userId: string, userName: string) => void;
}

export function UserProfile({ userId, onSelect }: UserProfileProps) {
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => {
    return doc(firestore, 'users', userId);
  }, [userId, firestore]);

  const { data: user, isLoading, error } = useDoc<UserProfileData>(userDocRef);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error loading user.</p>;
  }

  if (!user) {
    return null; // Or some fallback UI for user not found
  }

  const fullName = `${user.name} ${user.lastName}`;
  const fallback = (user.name?.[0] ?? '') + (user.lastName?.[0] ?? '');

  return (
    <Button
      variant="ghost"
      className="flex h-auto w-full items-center justify-start p-3"
      onClick={() => onSelect(userId, fullName)}
    >
      <div className="flex items-center space-x-3 text-left">
        <Avatar>
          <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{fullName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </Button>
  );
}

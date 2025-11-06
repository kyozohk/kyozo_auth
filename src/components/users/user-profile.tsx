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

  const userDocRefLower = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [userId, firestore]);

  const userDocRefUpper = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'Users', userId);
  }, [userId, firestore]);

  const { data: userLower, isLoading: isLoadingLower, error: errorLower } = useDoc<UserProfileData>(userDocRefLower);
  const { data: userUpper, isLoading: isLoadingUpper, error: errorUpper } = useDoc<UserProfileData>(userDocRefUpper);

  const isLoading = isLoadingLower || isLoadingUpper;
  const user = userLower || userUpper;
  const error = user ? null : errorLower || errorUpper;


  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return <p className="p-3 text-sm text-destructive">Could not load user: {userId}</p>;
  }

  if (!user) {
    return (
        <div className="flex items-center space-x-4 p-3">
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

  const fullName = `${user.name || ''} ${user.lastName || ''}`.trim() || user.email || 'Unnamed User';
  const fallback = ((user.name?.[0] ?? '') + (user.lastName?.[0] ?? '')).trim() || 'U';

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
          {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
        </div>
      </div>
    </Button>
  );
}

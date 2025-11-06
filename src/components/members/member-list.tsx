'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/users/user-profile';
import { ChevronLeft } from 'lucide-react';


interface Participation {
  id: string;
  userId: string;
  communityId: string;
}

interface MemberListProps {
  communityId: string;
  onMemberSelect: (memberId: string, memberName: string) => void;
}

export function MemberList({ communityId, onMemberSelect }: MemberListProps) {
  const firestore = useFirestore();
  const participationsQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'participations'),
      where('communityId', '==', communityId)
    );
  }, [communityId, firestore]);

  const {
    data: participations,
    isLoading,
    error,
  } = useCollection<Participation>(participationsQuery);

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
        <div className='flex items-center mb-4'>
            <h2 className="text-2xl font-bold">Members</h2>
        </div>

      {isLoading && renderSkeleton()}
      {error && <p className="text-destructive">Error: {error.message}</p>}
      {!isLoading && !error && participations && (
        <div className="space-y-2">
          {participations.map((participation) => (
            <UserProfile
              key={participation.userId}
              userId={participation.userId}
              onSelect={onMemberSelect}
            />
          ))}
          {participations.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No members found in this community.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

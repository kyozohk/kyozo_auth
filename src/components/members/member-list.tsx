'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


interface Member {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

interface MemberListProps {
  communityId: string;
  onMemberSelect: (memberId: string, memberName: string) => void;
  onBack: () => void;
}

export function MemberList({ communityId, onMemberSelect, onBack }: MemberListProps) {
  const firestore = useFirestore();
  const membersQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, `communities/${communityId}/members`),
      orderBy('name')
    );
  }, [communityId, firestore]);

  const { data: members, isLoading, error } = useCollection<Member>(membersQuery);

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
             <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 lg:hidden">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">Members</h2>
        </div>
      
      {isLoading && renderSkeleton()}
      {error && <p className="text-destructive">Error: {error.message}</p>}
      {!isLoading && !error && members && (
        <div className="space-y-2">
          {members.map((member) => (
            <Button
              key={member.id}
              variant="ghost"
              className="flex items-center justify-start w-full h-auto p-3"
              onClick={() => onMemberSelect(member.id, member.name)}
            >
              <div className='flex items-center space-x-3 text-left'>
                <Avatar>
                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                </div>
              </div>
            </Button>
          ))}
          {members.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No members found in this community.</p>}
        </div>
      )}
    </div>
  );
}

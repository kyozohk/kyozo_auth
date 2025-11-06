'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/users/user-profile';

interface Member {
  userId: string;
  // Other properties can be added here if needed from the usersList object
}

interface MemberListProps {
  usersList: Member[];
  onMemberSelect: (memberId: string, memberName: string) => void;
}

export function MemberList({ usersList, onMemberSelect }: MemberListProps) {

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

      {!usersList && renderSkeleton()}
      
      {usersList && (
        <div className="space-y-2">
          {usersList.map((member) => (
            <UserProfile
              key={member.userId}
              userId={member.userId}
              onSelect={onMemberSelect}
            />
          ))}
          {usersList.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No members found in this community.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

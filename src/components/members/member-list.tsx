'use client';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/users/user-profile';

interface Member {
  userId: string;
  name?: string;
  email?: string;
}

interface MemberListProps {
  usersList: Member[];
  onMemberSelect: (memberId: string, memberName: string) => void;
  searchTerm: string;
  selectedMemberId?: string | null;
}

export function MemberList({ usersList, onMemberSelect, searchTerm, selectedMemberId }: MemberListProps) {
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
  
  const filteredUsers = React.useMemo(() => {
    if (!usersList) return [];
    return usersList.filter(user => {
        const name = user.name || '';
        const email = user.email || '';
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return name.toLowerCase().includes(lowerCaseSearchTerm) || email.toLowerCase().includes(lowerCaseSearchTerm);
    });
  }, [usersList, searchTerm]);


  return (
    <div className='flex flex-col h-full'>
      <h2 className="text-2xl font-bold mb-4">Members</h2>

      {!usersList && renderSkeleton()}

      {usersList && (
        <div className="space-y-2 overflow-y-auto">
          {filteredUsers.map((member) => (
            <UserProfile
              key={member.userId}
              userId={member.userId}
              onSelect={onMemberSelect}
              isSelected={selectedMemberId === member.userId}
            />
          ))}
          {filteredUsers.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {usersList.length > 0 ? 'No members match your search.' : 'No members found in this community.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

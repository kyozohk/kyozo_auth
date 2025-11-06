'use client';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/users/user-profile';

interface Member {
  userId: string;
  email?: string;
  [key: string]: any;
}

interface MemberListProps {
  members: Member[];
  onMemberSelect: (memberId: string, memberName: string) => void;
  searchTerm: string;
  selectedMemberId?: string | null;
}

export function MemberList({ members, onMemberSelect, searchTerm, selectedMemberId }: MemberListProps) {
  const [userProfiles, setUserProfiles] = React.useState<Record<string, {name: string, email: string}>>({});

  const handleProfileLoad = (userId: string, name: string, email: string) => {
    setUserProfiles(prev => ({...prev, [userId]: {name, email}}));
  };

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    if (searchTerm === '') {
      return members;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return members.filter(member => {
      const profile = userProfiles[member.userId];
      if (profile) {
        const name = profile.name || '';
        const email = profile.email || '';
        return name.toLowerCase().includes(lowerCaseSearchTerm) || email.toLowerCase().includes(lowerCaseSearchTerm);
      }
      // Fallback for initial render before profiles are loaded
      const memberEmail = member.email || '';
      return memberEmail.toLowerCase().includes(lowerCaseSearchTerm);
    });
  }, [members, searchTerm, userProfiles]);


  if (!members) {
    return (
        <div className='flex flex-col h-full'>
            <h2 className="text-2xl font-bold mb-4">Members</h2>
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
        </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      <h2 className="text-2xl font-bold mb-4">Members</h2>
      
      <div className="space-y-1 overflow-y-auto">
        {filteredMembers.map((member) => (
          <div key={member.userId} className="flex items-center space-x-1">
            <UserProfile
              userId={member.userId}
              onSelect={onMemberSelect}
              isSelected={selectedMemberId === member.userId}
              onProfileLoad={handleProfileLoad}
            />
          </div>
        ))}
        {members.length > 0 && filteredMembers.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
            No members match your search.
        </p>
        )}
        {members.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
            No members found in this community.
        </p>
        )}
      </div>
    </div>
  );
}

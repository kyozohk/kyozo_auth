'use client';
import React from 'react';
import type { Member, UserProfile } from '@/app/mongo/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileMongo } from './user-profile-mongo';

interface MemberListProps {
  members: Member[];
  profiles: Record<string, UserProfile>;
  isLoading: boolean;
  onMemberSelect: (member: Member) => void;
  searchTerm: string;
  selectedMemberId?: string | null;
}

export function MemberListMongo({ members, profiles, isLoading, onMemberSelect, searchTerm, selectedMemberId }: MemberListProps) {
  
  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    if (!searchTerm) return members;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return members.filter(member => {
      const profile = profiles[member.userId];
      if (profile) {
        const name = `${profile.name || ''} ${profile.lastName || ''}`.trim();
        const email = profile.email || '';
        return name.toLowerCase().includes(lowerCaseSearchTerm) || email.toLowerCase().includes(lowerCaseSearchTerm);
      }
      return false; // Don't show if profile not loaded yet
    });
  }, [members, searchTerm, profiles]);


  if (isLoading) {
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
            <UserProfileMongo
              userId={member.userId}
              profile={profiles[member.userId]}
              onSelect={() => onMemberSelect(member)}
              isSelected={selectedMemberId === member.userId}
            />
          </div>
        ))}
        {members.length > 0 && filteredMembers.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
            No members match your search.
        </p>
        )}
        {members.length === 0 && !isLoading && (
            <p className="p-4 text-center text-sm text-muted-foreground">
            No members found in this community.
        </p>
        )}
      </div>
    </div>
  );
}

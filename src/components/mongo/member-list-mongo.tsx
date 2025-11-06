'use client';
import React from 'react';
import type { Member } from '@/app/mongo/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfileMongo } from './user-profile-mongo';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface MemberListProps {
  members: Member[];
  isLoading: boolean;
  onMemberSelect: (member: Member) => void;
  selectedMemberId?: string | null;
}

export function MemberListMongo({ members, isLoading, onMemberSelect, selectedMemberId }: MemberListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    if (!members) return [];
    if (!searchTerm) return members;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return members.filter(member => {
        const name = member.displayName || '';
        const email = member.email || '';
        return name.toLowerCase().includes(lowerCaseSearchTerm) || email.toLowerCase().includes(lowerCaseSearchTerm);
    });
  }, [members, searchTerm]);


  const renderSkeleton = () => (
    <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
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
    <>
      <CardHeader className="p-0 mb-4">
          <CardTitle>Members</CardTitle>
          <CardDescription>Select a member</CardDescription>
      </CardHeader>
       <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      
      {isLoading ? renderSkeleton() : (
        <ScrollArea className='flex-1'>
            <div className="space-y-1 pr-4">
                {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-1">
                    <UserProfileMongo
                        member={member}
                        onSelect={() => onMemberSelect(member)}
                        isSelected={selectedMemberId === member.id}
                    />
                </div>
                ))}
                {members.length > 0 && filteredMembers.length === 0 && !isLoading && (
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
        </ScrollArea>
      )}
    </>
  );
}

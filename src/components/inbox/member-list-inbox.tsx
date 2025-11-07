'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '../ui/input';
import { Search, Copy } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  uid?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  data?: any;
  [key: string]: any;
}


interface MemberListProps {
  title: string;
  members: Member[];
  isLoading: boolean;
  onMemberSelect: (member: Member) => void;
  selectedMemberId?: string | null;
  hasSelectedCommunity: boolean;
  isMongo?: boolean;
}

export function MemberListInbox({ title, members, isLoading, onMemberSelect, selectedMemberId, hasSelectedCommunity, isMongo = false }: MemberListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

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

  const handleCopy = (member: Member) => {
    navigator.clipboard.writeText(JSON.stringify(member.data || member, null, 2));
    toast({
      title: 'Copied to clipboard!',
      description: 'Member JSON data has been copied.',
    });
  };

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
  
  if (!hasSelectedCommunity) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground">Select a community to see its members.</p>
        </div>
      )
  }

  return (
    <>
      <CardHeader className="p-0 mb-4">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Select a member to view messages</CardDescription>
      </CardHeader>
       <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
      
      {isLoading ? renderSkeleton() : (
        <ScrollArea className='flex-1 -mx-6'>
            <div className="space-y-1 px-6">
                {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                    <Button
                        variant={selectedMemberId === member.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start h-auto p-2 text-left"
                        onClick={() => onMemberSelect(member)}
                    >
                         <div className='flex items-center space-x-3'>
                          <Avatar>
                              <AvatarImage src={member.photoURL} alt={member.displayName} />
                              <AvatarFallback>{member.displayName?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1 truncate'>
                            <p className='truncate font-semibold'>{member.displayName}</p>
                            <p className='text-xs text-muted-foreground truncate'>{member.email}</p>
                          </div>
                        </div>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleCopy(member); }}
                        title="Copy JSON"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                ))}
                {members.length > 0 && filteredMembers.length === 0 && !isLoading && (
                    <p className="p-4 text-center text-sm text-muted-foreground">No members match your search.</p>
                )}
                {members.length === 0 && !isLoading && (
                    <p className="p-4 text-center text-sm text-muted-foreground">No members found in this community.</p>
                )}
            </div>
        </ScrollArea>
      )}
    </>
  );
}

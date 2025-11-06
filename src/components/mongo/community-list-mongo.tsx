'use client';

import React from 'react';
import type { Community } from '@/app/mongo/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '../ui/input';
import { Copy, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface CommunityListProps {
    communities: Community[];
    isLoading: boolean;
    selectedCommunityId: string | null;
    onCommunitySelect: (community: Community) => void;
}

export function CommunityListMongo({ communities, isLoading, selectedCommunityId, onCommunitySelect }: CommunityListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  const filteredCommunities = React.useMemo(() => {
    if (!communities) return [];
    return communities.filter(community => 
      community.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [communities, searchTerm]);

  const handleCopy = (community: Community) => {
    navigator.clipboard.writeText(JSON.stringify(community.data, null, 2));
    toast({
      title: 'Copied to clipboard!',
      description: 'Community JSON data has been copied.',
    });
  };

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 flex-1" />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <CardHeader className="p-0 mb-4">
          <CardTitle>Communities</CardTitle>
          <CardDescription>Select a community</CardDescription>
      </CardHeader>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search communities..."
          className="w-full pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {isLoading ? renderSkeleton() : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col space-y-1 pr-4">
              {filteredCommunities.map((community) => (
                  <div key={community.id} className="flex items-center space-x-2">
                    <Button
                        variant={selectedCommunityId === community.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start h-auto p-2 text-left"
                        onClick={() => onCommunitySelect(community)}
                    >
                        <div className='flex items-center space-x-3'>
                          <Avatar>
                              <AvatarImage src={community.communityProfileImage} alt={community.name} />
                              <AvatarFallback>{community.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1 truncate'>
                            <p className='truncate font-semibold'>{community.name}</p>
                            <p className='text-xs text-muted-foreground'>{community.memberCount} members</p>
                          </div>
                        </div>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleCopy(community); }}
                        title="Copy JSON"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                  </div>
              ))}
              {filteredCommunities.length === 0 && (
                  <p className='p-4 text-center text-sm text-muted-foreground'>
                      {communities && communities.length > 0 ? 'No communities match your search.' : 'No communities found.'}
                  </p>
              )}
            </div>
          </ScrollArea>
      )}
    </>
  );
}

'use client';

import React from 'react';
import type { Community } from '@/app/mongo/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommunityListProps {
    communities: Community[];
    isLoading: boolean;
    selectedCommunityId: string | null;
    onCommunitySelect: (community: Community) => void;
    searchTerm: string;
}

export function CommunityListMongo({ communities, isLoading, selectedCommunityId, onCommunitySelect, searchTerm }: CommunityListProps) {
  
  const filteredCommunities = React.useMemo(() => {
    if (!communities) return [];
    return communities.filter(community => 
      community.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [communities, searchTerm]);

  const renderSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-3/4" />
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
        
        {isLoading && renderSkeleton()}
        {!isLoading && (
            <div className="flex flex-col space-y-1">
            {filteredCommunities.map((community) => (
                <div key={community._id} className="flex items-center space-x-2">
                <Button
                    variant={selectedCommunityId === community._id ? 'secondary' : 'ghost'}
                    className={cn(
                        "w-full justify-start h-auto p-2 text-left",
                    )}
                    onClick={() => onCommunitySelect(community)}
                >
                    <div className='flex items-center space-x-3'>
                    <Avatar>
                        <AvatarImage src={community.communityProfileImage} alt={community.name} />
                        <AvatarFallback>{community.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className='truncate'>{community.name}</span>
                    </div>
                </Button>
                </div>
            ))}
            {filteredCommunities.length === 0 && (
                <p className='p-4 text-center text-sm text-muted-foreground'>
                    {communities && communities.length > 0 ? 'No communities match your search.' : 'No communities found.'}
                </p>
            )}
            </div>
        )}
    </>
  );
}

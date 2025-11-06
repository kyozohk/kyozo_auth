'use client';

import React from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface Community {
  id: string;
  name: string;
  communityProfileImage?: string;
  createdAt: any;
  [key: string]: any;
}

interface CommunityListProps {
    selectedCommunityId: string | null;
    onCommunitySelect: (community: Community) => void;
    searchTerm: string;
}

export function CommunityList({ selectedCommunityId, onCommunitySelect, searchTerm }: CommunityListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const communitiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'communities'), orderBy('name'));
  }, [user, firestore]);

  const { data: communities, isLoading, error } = useCollection<Community>(communitiesQuery);

  const filteredCommunities = React.useMemo(() => {
    if (!communities) return [];
    return communities.filter(community => 
      community.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [communities, searchTerm]);


  const handleCopy = (community: Community) => {
    navigator.clipboard.writeText(JSON.stringify(community, null, 2));
    toast({
      title: 'Copied to clipboard!',
      description: 'Community data has been copied.',
    });
  };

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
        {error && <p className="text-destructive">Error: {error.message}</p>}
        {!isLoading && !error && (
            <div className="flex flex-col space-y-1">
            {filteredCommunities.map((community) => (
                <div key={community.id} className="flex items-center space-x-2">
                <Button
                    variant={selectedCommunityId === community.id ? 'secondary' : 'ghost'}
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
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => handleCopy(community)}
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
        )}
    </>
  );
}

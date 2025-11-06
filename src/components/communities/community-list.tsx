'use client';

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


interface Community {
  id: string;
  name: string;
  createdAt: any;
}

interface CommunityListProps {
    selectedCommunityId: string | null;
    onCommunitySelect: (communityId: string) => void;
}

export function CommunityList({ selectedCommunityId, onCommunitySelect }: CommunityListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const communitiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'communities'), orderBy('name'));
  }, [user, firestore]);

  const { data: communities, isLoading, error } = useCollection<Community>(communitiesQuery);

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
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communities</CardTitle>
        <CardDescription>Select a community</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && renderSkeleton()}
        {error && <p className="text-destructive">Error: {error.message}</p>}
        {!isLoading && !error && communities && (
          <div className="flex flex-col space-y-2">
            {communities.map((community) => (
              <div key={community.id} className="flex items-center space-x-2">
                <Button
                  variant={selectedCommunityId === community.id ? 'default' : 'ghost'}
                  className={cn(
                      "w-full justify-start",
                      selectedCommunityId === community.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onCommunitySelect(community.id)}
                >
                  {community.name}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(community)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {communities.length === 0 && <p className='text-sm text-muted-foreground'>No communities found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

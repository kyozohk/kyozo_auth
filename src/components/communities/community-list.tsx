'use client';

import { useAuth } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

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
  const { user } = useAuth();

  const communitiesQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Assuming communities are at the root level
    return query(collection(db, 'communities'), orderBy('name'));
  }, [user]);

  const { data: communities, isLoading, error } = useCollection<Community>(communitiesQuery);

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
              <Button
                key={community.id}
                variant={selectedCommunityId === community.id ? 'default' : 'ghost'}
                className={cn(
                    "w-full justify-start",
                    selectedCommunityId === community.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => onCommunitySelect(community.id)}
              >
                {community.name}
              </Button>
            ))}
            {communities.length === 0 && <p className='text-sm text-muted-foreground'>No communities found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

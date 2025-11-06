'use client';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/users/user-profile';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

interface Channel {
  id: string;
  user: string; // This is the userId
  community: string;
}

interface MemberListProps {
  communityId: string | null;
  onMemberSelect: (memberId: string, memberName: string) => void;
  searchTerm: string;
  selectedMemberId?: string | null;
}

export function MemberList({ communityId, onMemberSelect, searchTerm, selectedMemberId }: MemberListProps) {
  const firestore = useFirestore();

  const channelsQuery = useMemoFirebase(() => {
    if (!communityId) return null;
    return query(collection(firestore, 'channels'), where('community', '==', communityId));
  }, [communityId, firestore]);

  const { data: channels, isLoading, error } = useCollection<Channel>(channelsQuery);

  const [filteredUsers, setFilteredUsers] = React.useState<string[]>([]);
  const [userProfiles, setUserProfiles] = React.useState<Record<string, {name: string, email: string}>>({});

  const handleProfileLoad = (userId: string, name: string, email: string) => {
    setUserProfiles(prev => ({...prev, [userId]: {name, email}}));
  };

  React.useEffect(() => {
    if (!channels) {
      setFilteredUsers([]);
      return;
    }
    const userIds = channels.map(c => c.user);
    if (searchTerm === '') {
      setFilteredUsers(userIds);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = userIds.filter(userId => {
        const profile = userProfiles[userId];
        if (!profile) return false;
        const name = profile.name || '';
        const email = profile.email || '';
        return name.toLowerCase().includes(lowerCaseSearchTerm) || email.toLowerCase().includes(lowerCaseSearchTerm);
      });
      setFilteredUsers(filtered);
    }
  }, [channels, searchTerm, userProfiles]);

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
      
      {error && <p className="text-destructive text-center p-4">Error loading members: {error.message}</p>}

      {!isLoading && !error && (
        <div className="space-y-2 overflow-y-auto">
          {channels && filteredUsers.map((userId) => (
            <UserProfile
              key={userId}
              userId={userId}
              onSelect={onMemberSelect}
              isSelected={selectedMemberId === userId}
              onProfileLoad={handleProfileLoad}
            />
          ))}
          {channels && channels.length > 0 && filteredUsers.length === 0 && (
             <p className="p-4 text-center text-sm text-muted-foreground">
                No members match your search.
            </p>
          )}
          {!channels && communityId && (
             <p className="p-4 text-center text-sm text-muted-foreground">
                No members found in this community.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

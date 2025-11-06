'use client';
import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserProfile } from '@/components/users/user-profile';
import { useFirestore, useUser } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  user: string; // This is the userId
  community: string;
}

interface Message {
  id: string;
  text: string;
  createdAt: any;
  sender: string;
  channel: string;
}

interface MemberListProps {
  communityId: string | null;
  onMemberSelect: (memberId: string, memberName: string) => void;
  searchTerm: string;
  selectedMemberId?: string | null;
  selectedCommunityId: string | null;
}

export function MemberList({ communityId, onMemberSelect, searchTerm, selectedMemberId, selectedCommunityId }: MemberListProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

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
  
  const handleCopy = async (memberId: string) => {
    if (!currentUser || !firestore || !selectedCommunityId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot copy data. User or community not selected.",
      });
      return;
    }

    const memberProfile = userProfiles[memberId] || null;
    let messages: Message[] = [];

    // 1. Find the channel between current user and selected member
    const channelsRef = collection(firestore, 'channels');
    const q = query(
        channelsRef, 
        where('community', '==', selectedCommunityId),
        where('users', 'array-contains-any', [currentUser.uid, memberId]),
        limit(20)
    );

    try {
        const channelSnapshot = await getDocs(q);
        let foundChannelId: string | null = null;
        for (const doc of channelSnapshot.docs) {
            const channel = doc.data();
            const users = channel.users || [];
            if (users.includes(currentUser.uid) && users.includes(memberId)) {
                foundChannelId = doc.id;
                break; 
            }
        }

        // 2. Fetch messages from that channel
        if (foundChannelId) {
            const messagesQuery = query(
                collection(firestore, 'messages'),
                where('channel', '==', foundChannelId),
                where('sender', 'in', [currentUser.uid, memberId])
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        }

        // 3. Copy to clipboard
        const dataToCopy = {
            memberProfile,
            messages,
        };
        navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
        toast({
            title: 'Copied to clipboard!',
            description: 'Member profile and messages have been copied.',
        });

    } catch (e: any) {
        console.error("Error copying data:", e);
        toast({
            variant: "destructive",
            title: "Failed to copy data",
            description: e.message,
        });
    }
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
        <div className="space-y-1 overflow-y-auto">
          {channels && filteredUsers.map((userId) => (
            <div key={userId} className="flex items-center space-x-1">
              <UserProfile
                userId={userId}
                onSelect={onMemberSelect}
                isSelected={selectedMemberId === userId}
                onProfileLoad={handleProfileLoad}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                onClick={() => handleCopy(userId)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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

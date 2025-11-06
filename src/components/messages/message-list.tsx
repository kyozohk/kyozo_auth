'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import React, { useEffect, useState } from 'react';


interface Message {
  id: string;
  text: string;
  createdAt: any;
  sender: string; // user ID
  // Assuming senderName might not be on the message doc directly
}

interface Channel {
    id: string;
    users: string[];
    community: string;
}

interface UserProfile {
    name: string;
    lastName?: string;
    email: string;
}

interface MessageListProps {
  currentUserId: string;
  selectedUserId: string;
  selectedUserName: string;
  selectedCommunityId: string | null;
  onBack: () => void;
}

export function MessageList({ currentUserId, selectedUserId, selectedUserName, selectedCommunityId, onBack }: MessageListProps) {
  const firestore = useFirestore();
  const [channelId, setChannelId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);

  useEffect(() => {
    const findChannel = async () => {
        if (!currentUserId || !selectedUserId || !selectedCommunityId) {
            setIsLoadingChannel(false);
            return;
        }
        setIsLoadingChannel(true);
        const channelsRef = collection(firestore, 'channels');
        // Query for channel belonging to the community and containing both users
        const q = query(
            channelsRef, 
            where('community', '==', selectedCommunityId),
            where('users', 'array-contains-any', [currentUserId, selectedUserId]),
            limit(20) // Increased limit to be safe
        );
        
        try {
            const snapshot = await getDocs(q);
            let foundChannelId = null;
            for (const doc of snapshot.docs) {
                const channel = doc.data() as Channel;
                const users = channel.users || [];
                // Ensure the channel contains BOTH users, not just one of them
                if (users.includes(currentUserId) && users.includes(selectedUserId)) {
                    foundChannelId = doc.id;
                    break; 
                }
            }
            setChannelId(foundChannelId);
        } catch(e) {
            console.error("Error finding channel: ", e);
            setChannelId(null);
        } finally {
            setIsLoadingChannel(false);
        }
    };

    findChannel();
  }, [currentUserId, selectedUserId, selectedCommunityId, firestore]);

  const messagesQuery = useMemoFirebase(() => {
    if (!channelId) return null;
    return query(
      collection(firestore, 'messages'),
      where('channel', '==', channelId),
      orderBy('createdAt', 'desc')
    );
  }, [channelId, firestore]);

  const { data: messages, isLoading: isLoadingMessages, error } = useCollection<Message>(messagesQuery);
  
  const senderIds = useMemoFirebase(() => {
    if (!messages) return [];
    return [...new Set(messages.map(m => m.sender))];
  }, [messages]);

  useEffect(() => {
      const fetchProfiles = async () => {
        if (!senderIds || senderIds.length === 0) return;
        const newProfiles: Record<string, UserProfile> = {};
        
        // This fetches profiles one by one. For production, consider a 'in' query if you have many messages from many users.
        for (const id of senderIds) {
            if (userProfiles[id]) continue; // Don't re-fetch
            const userQuery = query(collection(firestore, 'users'), where('id', '==', id), limit(1));
            const userSnapshot = await getDocs(userQuery);
            if (!userSnapshot.empty) {
                newProfiles[id] = userSnapshot.docs[0].data() as UserProfile;
            }
        }
        if (Object.keys(newProfiles).length > 0) {
            setUserProfiles(prev => ({...prev, ...newProfiles}));
        }
      };
      fetchProfiles();
  }, [senderIds, firestore, userProfiles]);


  const getSenderName = (senderId: string) => {
      if (senderId === currentUserId) return 'You';
      const profile = userProfiles[senderId];
      if (profile) return `${profile.name || ''} ${profile.lastName || ''}`.trim();
      return selectedUserName; // Fallback to the name we already have
  }

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );

  const isLoading = isLoadingChannel || isLoadingMessages;

  return (
    <div className='h-full flex flex-col'>
        <div className='flex items-center mb-4'>
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold truncate">Messages with {selectedUserName}</h2>
        </div>
      
      {isLoading && renderSkeleton()}
      {error && <p className="text-destructive">Error: {error.message}</p>}

      {!isLoading && !error && messages && (
        <div className="space-y-4 flex-1 overflow-y-auto">
          {messages.map((message) => {
            const senderName = getSenderName(message.sender);
            return (
                <div key={message.id} className="flex items-start space-x-3 p-3 border rounded-md">
                <Avatar>
                        <AvatarFallback>{senderName ? senderName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                <div>
                    <p className="font-semibold">{senderName}</p>
                    <p className="text-sm text-muted-foreground">
                    {message.createdAt?.toDate ? new Date(message.createdAt.toDate()).toLocaleString() : 'No date'}
                    </p>
                    <p className="mt-1">{message.text}</p>
                </div>
                </div>
            )
          })}
          {messages.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No messages found in this conversation.</p>}
        </div>
      )}
       {!isLoading && channelId === null && <p className='text-sm text-muted-foreground p-4 text-center'>No message channel found with this user.</p>}
    </div>
  );
}

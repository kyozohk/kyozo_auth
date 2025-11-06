'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@/firebase';
import { Input } from '../ui/input';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface Message {
  id: string;
  text: string;
  createdAt: any;
  sender: string; // user ID
}

interface Channel {
    id: string;
    users: string[];
    community: string;
}

interface UserProfile {
    id: string;
    name: string;
    lastName?: string;
    email: string;
    profileImage?: string;
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
  const { user: currentUser } = useUser();
  const [channelId, setChannelId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  // 1. Find the conversation channel
  useEffect(() => {
    const findChannel = async () => {
        if (!currentUserId || !selectedUserId || !selectedCommunityId || !firestore) {
            setIsLoadingChannel(false);
            return;
        }
        setIsLoadingChannel(true);
        const channelsRef = collection(firestore, 'channels');
        const q = query(
            channelsRef, 
            where('community', '==', selectedCommunityId),
            where('users', 'array-contains', currentUserId)
        );
        
        try {
            const snapshot = await getDocs(q);
            let foundChannelId = null;
            for (const doc of snapshot.docs) {
                const channel = doc.data() as Channel;
                if (channel.users && channel.users.includes(selectedUserId)) {
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

  // 2. Fetch messages for that channel
  const messagesQuery = useMemoFirebase(() => {
    if (!channelId) return null;
    return query(
      collection(firestore, 'messages'),
      where('channel', '==', channelId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [channelId, firestore]);

  const { data: messages, isLoading: isLoadingMessages, error } = useCollection<Message>(messagesQuery);
  
  // 3. Fetch profiles for senders
  const senderIds = useMemo(() => {
    if (!messages) return [];
    return [...new Set(messages.map(m => m.sender))];
  }, [messages]);

  useEffect(() => {
      const fetchProfiles = async () => {
        if (!senderIds || senderIds.length === 0 || !firestore) return;
        
        const idsToFetch = senderIds.filter(id => !userProfiles[id]);
        if (idsToFetch.length === 0) return;

        // Use 'in' query for efficiency
        const usersQuery = query(collection(firestore, 'users'), where('id', 'in', idsToFetch));
        const upperUsersQuery = query(collection(firestore, 'Users'), where('id', 'in', idsToFetch));
        
        const [usersSnapshot, upperUsersSnapshot] = await Promise.all([
            getDocs(usersQuery),
            getDocs(upperUsersQuery)
        ]);

        const newProfiles: Record<string, UserProfile> = {};
        
        usersSnapshot.forEach(doc => {
            const data = doc.data() as UserProfile;
            if(data.id) newProfiles[data.id] = data;
        });
        upperUsersSnapshot.forEach(doc => {
            const data = doc.data() as UserProfile;
            if(data.id && !newProfiles[data.id]) newProfiles[data.id] = data;
        });

        if (Object.keys(newProfiles).length > 0) {
            setUserProfiles(prev => ({...prev, ...newProfiles}));
        }
      };
      fetchProfiles();
  }, [senderIds, firestore, userProfiles]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelId || !currentUser) return;

    const messagesCol = collection(firestore, 'messages');
    addDocumentNonBlocking(messagesCol, {
        text: newMessage,
        createdAt: serverTimestamp(),
        sender: currentUser.uid, // This should be the Firebase Auth UID
        channel: channelId,
    });
    setNewMessage('');
  };

  const getSenderName = (senderId: string) => {
      if (senderId === currentUserId) return 'You';
      const profile = Object.values(userProfiles).find(p => p.id === senderId);
      if (profile) return `${profile.name || ''} ${profile.lastName || ''}`.trim() || profile.email;
      return selectedUserName;
  };

   const getSenderAvatar = (senderId: string) => {
      if (senderId === currentUserId) return currentUser?.photoURL;
      const profile = Object.values(userProfiles).find(p => p.id === senderId);
      return profile?.profileImage;
  };

   const getSenderFallback = (senderId: string) => {
      if (senderId === currentUserId) return currentUser?.displayName?.charAt(0) || 'Y';
      const profile = Object.values(userProfiles).find(p => p.id === senderId);
      if(profile) return ((profile.name?.[0] ?? '') + (profile.lastName?.[0] ?? '')).trim() || 'U';
      return selectedUserName.charAt(0);
  };


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
        <div className='flex items-center mb-4 flex-shrink-0'>
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 lg:hidden">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold truncate">Messages with {selectedUserName}</h2>
        </div>
      
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
            {isLoading && renderSkeleton()}
            {error && <p className="text-destructive">Error: {error.message}</p>}
            {!isLoading && !error && messages && messages.map((message) => {
                const senderName = getSenderName(message.sender);
                return (
                    <div key={message.id} className="flex items-start space-x-3 p-3">
                        <Avatar>
                            <AvatarImage src={getSenderAvatar(message.sender)} />
                            <AvatarFallback>{getSenderFallback(message.sender).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{senderName}</p>
                            <p className="text-sm text-muted-foreground">
                                {message.createdAt?.toDate ? new Date(message.createdAt.toDate()).toLocaleString() : ''}
                            </p>
                            <p className="mt-1 bg-muted p-3 rounded-lg">{message.text}</p>
                        </div>
                    </div>
                )
            })}
            {!isLoading && channelId && messages?.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No messages found. Start the conversation!</p>}
            {!isLoading && !channelId && <p className='text-sm text-muted-foreground p-4 text-center'>No message channel found with this user in this community.</p>}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-auto pt-2 border-t">
            <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={!channelId}
            />
            <Button type="submit" size="icon" disabled={!channelId || !newMessage.trim()}>
                <Send className="h-4 w-4" />
            </Button>
        </form>
    </div>
  );
}

'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Copy, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@/firebase';
import { Input } from '../ui/input';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';


interface Message {
  id: string;
  text: string;
  createdAt: any;
  sender: string; // user ID
  channel: string;
  [key: string]: any;
}

interface Channel {
    id: string;
    users: string[];
    community: string;
}

interface UserProfile {
    id: string;
    name?: string;
    lastName?: string;
    displayName?: string;
    email: string;
    profileImage?: string;
    photoURL?: string;
}

interface MessageListProps {
  currentUserId: string;
  selectedUserId: string;
  selectedUserName: string;
  selectedCommunityId: string | null;
  onBack: () => void;
}

// Custom hook to fetch a user profile
function useUserProfile(userId: string) {
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => {
        if (!userId) return null;
        return doc(firestore, 'users', userId);
    }, [userId, firestore]);
    const { data: user, isLoading } = useDoc<UserProfile>(userDocRef);
    return { user, isLoading };
}


export function MessageList({ currentUserId, selectedUserId, selectedUserName, selectedCommunityId, onBack }: MessageListProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [channelId, setChannelId] = useState<string | null>(null);
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
        
        // Query for channels in the community that include the current user
        const q = query(
            channelsRef, 
            where('community', '==', selectedCommunityId),
            where('users', 'array-contains', currentUserId)
        );
        
        try {
            const snapshot = await getDocs(q);
            let foundChannelId = null;
            // Client-side filter to find the channel that ALSO includes the selected user
            for (const doc of snapshot.docs) {
                const channelData = doc.data();
                if (channelData.users && channelData.users.includes(selectedUserId)) {
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
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [channelId, firestore]);

  const { data: messages, isLoading: isLoadingMessages, error } = useCollection<Message>(messagesQuery);
  
  // 3. Fetch profiles for sender and receiver for avatars
  const { user: selectedUserProfile } = useUserProfile(selectedUserId);
  const { user: currentUserProfile } = useUserProfile(currentUserId);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !channelId || !currentUser) return;

    const messagesCol = collection(firestore, 'messages');
    addDocumentNonBlocking(messagesCol, {
        text: newMessage,
        createdAt: serverTimestamp(),
        sender: currentUser.uid, 
        channel: channelId,
    });
    setNewMessage('');
  };

  const handleCopy = (message: Message) => {
    navigator.clipboard.writeText(JSON.stringify(message, null, 2));
    toast({
      title: 'Copied to clipboard!',
      description: 'Message JSON data has been copied.',
    });
  };

  const getSenderName = (senderId: string) => {
      if (senderId === currentUserId) return 'You';
      return selectedUserProfile?.displayName || selectedUserProfile?.name || selectedUserName;
  };

   const getSenderAvatar = (senderId: string) => {
      if (senderId === currentUserId) return currentUserProfile?.photoURL || currentUser?.photoURL;
      return selectedUserProfile?.photoURL;
  };

   const getSenderFallback = (senderId: string) => {
      if (senderId === currentUserId) {
        const name = currentUserProfile?.displayName || currentUser?.displayName || 'Y';
        return name.charAt(0);
      }
      const name = selectedUserProfile?.displayName || selectedUserProfile?.name || selectedUserName;
      return name.charAt(0);
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
      
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-4">
            {isLoading && renderSkeleton()}
            {error && <p className="text-destructive">Error: {error.message}</p>}
            {!isLoading && !error && messages && messages.map((message) => {
                const isSender = message.sender === currentUserId;
                return (
                    <div
                        key={message.id}
                        className={cn(
                            'group flex w-full items-start gap-3 relative',
                            isSender && 'justify-end'
                        )}
                    >
                        {!isSender && (
                            <Avatar className='flex-shrink-0'>
                                <AvatarImage src={getSenderAvatar(message.sender)} />
                                <AvatarFallback>{getSenderFallback(message.sender).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={cn('flex flex-col max-w-[80%]', isSender ? 'items-end' : 'items-start')}>
                             <p className="font-semibold text-sm">{getSenderName(message.sender)}</p>
                            <p className="text-xs text-muted-foreground">
                                {message.createdAt?.toDate ? new Date(message.createdAt.toDate()).toLocaleString() : ''}
                            </p>
                             <div className={cn(
                                'mt-1 inline-block rounded-lg px-3 py-2 relative',
                                isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                <p className="text-sm">{message.text}</p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 absolute -top-2",
                                        isSender ? "-left-2" : "-right-2"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); handleCopy(message); }}
                                    title="Copy JSON"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        {isSender && (
                            <Avatar className='flex-shrink-0'>
                                <AvatarImage src={getSenderAvatar(message.sender)} />
                                <AvatarFallback>{getSenderFallback(message.sender).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )}
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

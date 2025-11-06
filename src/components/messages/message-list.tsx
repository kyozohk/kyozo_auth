'use client';

import { useCollection, useDoc } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where, doc, getDocs, limit } from 'firebase/firestore';
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
  senderId: string;
  senderName: string;
}

interface Channel {
    id: string;
    users: string[];
}

interface MessageListProps {
  currentUserId: string;
  selectedUserId: string;
  selectedUserName: string;
  onBack: () => void;
}

export function MessageList({ currentUserId, selectedUserId, selectedUserName, onBack }: MessageListProps) {
  const firestore = useFirestore();
  const [channelId, setChannelId] = useState<string | null>(null);

  useEffect(() => {
    const findChannel = async () => {
        if (!currentUserId || !selectedUserId) return;

        const channelsRef = collection(firestore, 'channels');
        // Firestore doesn't support array-contains-all, so we have to check for both permutations
        const userArray1 = [currentUserId, selectedUserId];
        const userArray2 = [selectedUserId, currentUserId];

        const q1 = query(channelsRef, where('users', '==', userArray1), limit(1));
        const q2 = query(channelsRef, where('users', '==', userArray2), limit(1));

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        if (!snapshot1.empty) {
            setChannelId(snapshot1.docs[0].id);
        } else if (!snapshot2.empty) {
            setChannelId(snapshot2.docs[0].id);
        } else {
            setChannelId(null);
        }
    };

    findChannel();
  }, [currentUserId, selectedUserId, firestore]);

  const messagesQuery = useMemoFirebase(() => {
    if (!channelId) return null;
    return query(
      collection(firestore, 'channels', channelId, 'messages'),
      orderBy('createdAt', 'desc')
    );
  }, [channelId, firestore]);

  const { data: messages, isLoading, error } = useCollection<Message>(messagesQuery);

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
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3 p-3 border rounded-md">
               <Avatar>
                    <AvatarFallback>{message.senderName ? message.senderName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
              <div>
                <p className="font-semibold">{message.senderName || 'Unknown Sender'}</p>
                <p className="text-sm text-muted-foreground">
                  {message.createdAt?.toDate ? new Date(message.createdAt.toDate()).toLocaleString() : 'No date'}
                </p>
                <p className="mt-1">{message.text}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No messages found in this conversation.</p>}
        </div>
      )}
       {!isLoading && channelId === null && <p className='text-sm text-muted-foreground p-4 text-center'>No message channel found with this user.</p>}
    </div>
  );
}

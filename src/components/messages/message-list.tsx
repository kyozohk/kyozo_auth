'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';


interface Message {
  id: string;
  text: string;
  createdAt: any;
  // Assume a message has a senderId which is the user's ID
  senderId: string;
  senderName: string;
}

interface MessageListProps {
  userId: string;
  userName: string;
  onBack: () => void;
}

export function MessageList({ userId, userName, onBack }: MessageListProps) {
  const messagesQuery = useMemoFirebase(() => {
    // This query assumes a top-level 'messages' collection
    // and filters messages by the selected user's ID.
    return query(
      collection(db, 'messages'),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [userId]);

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
    <div>
        <div className='flex items-center mb-4'>
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold truncate">Messages from {userName}</h2>
        </div>
      
      {isLoading && renderSkeleton()}
      {error && <p className="text-destructive">Error: {error.message}</p>}
      {!isLoading && !error && messages && (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3 p-3 border rounded-md">
               <Avatar>
                    <AvatarFallback>{message.senderName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              <div>
                <p className="font-semibold">{message.senderName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(message.createdAt?.toDate()).toLocaleString()}
                </p>
                <p className="mt-1">{message.text}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No messages found for this user.</p>}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import type { Message, Member, UserProfile } from '@/app/mongo/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  profiles: Record<string, UserProfile>;
  currentUserId: string;
  selectedMember: Member;
  onBack: () => void;
}

export function MessageListMongo({ messages, isLoading, profiles, currentUserId, selectedMember, onBack }: MessageListProps) {
  const [newMessage, setNewMessage] = React.useState('');

  const getSenderProfile = (senderId: string): UserProfile | undefined => {
    // This is a simplification. The current user's profile is not fetched in this example.
    if (senderId === currentUserId) {
        return undefined; // Or fetch current user's profile
    }
    return Object.values(profiles).find(p => p.id === senderId);
  }

  const getSenderName = (senderId: string) => {
      if (senderId === currentUserId) return 'You';
      const profile = getSenderProfile(senderId);
      if (profile) return `${profile.name || ''} ${profile.lastName || ''}`.trim() || profile.email;
      const memberProfile = profiles[selectedMember.userId];
      if (memberProfile) return `${memberProfile.name || ''} ${memberProfile.lastName || ''}`.trim() || memberProfile.email;
      return 'Unknown User';
  };

   const getSenderAvatar = (senderId: string) => {
      const profile = getSenderProfile(senderId);
      return profile?.profileImage;
  };

   const getSenderFallback = (senderId: string) => {
      const profile = getSenderProfile(senderId);
      if(profile) return ((profile.name?.[0] ?? '') + (profile.lastName?.[0] ?? '')).trim() || 'U';
      const memberProfile = profiles[selectedMember.userId];
      if (memberProfile) return ((memberProfile.name?.[0] ?? '') + (memberProfile.lastName?.[0] ?? '')).trim() || 'U';
      return 'U';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Sending messages is not implemented in this read-only example
    console.log("Sending message:", newMessage);
    setNewMessage('');
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

  const selectedMemberName = getSenderName(selectedMember.userId);

  return (
    <div className='h-full flex flex-col'>
        <div className='flex items-center mb-4 flex-shrink-0'>
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 lg:hidden">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold truncate">Messages with {selectedMemberName}</h2>
        </div>
      
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
            {isLoading && renderSkeleton()}
            {!isLoading && messages && messages.map((message) => {
                const senderName = getSenderName(message.sender);
                return (
                    <div key={message._id} className="flex items-start space-x-3 p-3">
                        <Avatar>
                            <AvatarImage src={getSenderAvatar(message.sender)} />
                            <AvatarFallback>{getSenderFallback(message.sender).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{senderName}</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(message.createdAt).toLocaleString()}
                            </p>
                            <p className="mt-1 bg-muted p-3 rounded-lg">{message.text}</p>
                        </div>
                    </div>
                )
            })}
            {!isLoading && messages?.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No messages found.</p>}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-auto pt-2 border-t">
            <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                <Send className="h-4 w-4" />
            </Button>
        </form>
    </div>
  );
}

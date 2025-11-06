'use client';

import React from 'react';
import type { Message, Member } from '@/app/mongo/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Copy, Search, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentUserId: string; // Assuming this is Firebase UID
  selectedMember: Member;
  onBack: () => void;
}

export function MessageListMongo({ messages, isLoading, currentUserId, selectedMember, onBack }: MessageListProps) {
  const [newMessage, setNewMessage] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Sending messages is not implemented in this read-only example
    toast({ title: "Send Message", description: "This is a read-only demo." });
    setNewMessage('');
  };

  const handleCopy = (message: Message) => {
    navigator.clipboard.writeText(JSON.stringify(message.data, null, 2));
    toast({
      title: 'Copied to clipboard!',
      description: 'Message JSON data has been copied.',
    });
  };

  const filteredMessages = React.useMemo(() => {
    if (!messages) return [];
    if (!searchTerm) return messages;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return messages.filter(m => m.text.toLowerCase().includes(lowerCaseSearch));
  }, [messages, searchTerm]);

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
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
        <CardHeader className="p-0 mb-4">
            <div className='flex items-center'>
                 <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 lg:hidden">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className='flex-1 truncate'>
                    <CardTitle className='truncate'>Messages with {selectedMember.displayName}</CardTitle>
                    <CardDescription className='truncate'>{selectedMember.email}</CardDescription>
                </div>
            </div>
        </CardHeader>

        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search messages..."
                className="w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      
        <ScrollArea className="flex-1 -mx-6">
            <div className="px-6">
                {isLoading ? renderSkeleton() : (
                    <div className="space-y-4">
                        {filteredMessages.map((message) => (
                            <div key={message.id} className="group flex items-start space-x-3 p-3 relative">
                                <Avatar>
                                    <AvatarImage src={message.sender.photoURL} />
                                    <AvatarFallback>{message.sender.displayName?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                                <div className='flex-1'>
                                    <p className="font-semibold">{message.sender.displayName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(message.createdAt), 'Pp')}
                                    </p>
                                    <p className="mt-1 text-sm">{message.text}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 absolute top-2 right-2"
                                    onClick={(e) => { e.stopPropagation(); handleCopy(message); }}
                                    title="Copy JSON"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {!isLoading && messages?.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No messages found.</p>}
                        {!isLoading && messages?.length > 0 && filteredMessages.length === 0 && <p className='text-sm text-muted-foreground p-4 text-center'>No messages match your search.</p>}
                    </div>
                )}
            </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-auto pt-4 border-t">
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

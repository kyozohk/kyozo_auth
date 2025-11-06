'use client';

import type { Member } from '@/app/mongo/actions';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React from 'react';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface UserProfileProps {
  member: Member;
  onSelect: () => void;
  isSelected?: boolean;
}

export function UserProfileMongo({ member, onSelect, isSelected }: UserProfileProps) {
  const { toast } = useToast();

  const handleCopy = (member: Member) => {
    navigator.clipboard.writeText(JSON.stringify(member.data, null, 2));
    toast({
      title: 'Copied to clipboard!',
      description: 'Member JSON data has been copied.',
    });
  };

  const fullName = member.displayName || 'Unnamed User';
  const fallback = member.displayName?.charAt(0) || '?';

  return (
    <div className='flex w-full items-center space-x-2'>
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className="flex h-auto flex-1 items-center justify-start p-3"
        onClick={onSelect}
      >
        <div className="flex items-center space-x-3 text-left">
          <Avatar>
            <AvatarImage src={member.photoURL} alt={fullName} />
            <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex-1 truncate'>
            <div className='flex items-center gap-2'>
              <p className="font-semibold truncate">{fullName}</p>
              {member.role !== 'member' && <Badge variant="outline" className='capitalize'>{member.role}</Badge>}
            </div>
            {member.email && <p className="text-sm text-muted-foreground truncate">{member.email}</p>}
          </div>
        </div>
      </Button>
       <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); handleCopy(member); }}
            title="Copy JSON"
        >
            <Copy className="h-4 w-4" />
        </Button>
    </div>
  );
}

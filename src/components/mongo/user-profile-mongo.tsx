'use client';

import type { UserProfile } from '@/app/mongo/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React from 'react';

interface UserProfileProps {
  userId: string;
  profile?: UserProfile;
  onSelect: () => void;
  isSelected?: boolean;
}

export function UserProfileMongo({ userId, profile, onSelect, isSelected }: UserProfileProps) {

  if (!profile) {
    return (
        <div className="flex items-center space-x-4 p-3 opacity-50 w-full">
            <Avatar>
            <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div>
            <p className="font-semibold">Unknown User</p>
            <p className="text-sm text-muted-foreground">{userId}</p>
            </div>
        </div>
    );
  }
  
  const fullName = `${profile.name || ''} ${profile.lastName || ''}`.trim() || profile.email || 'Unnamed User';
  const fallback = ((profile.name?.[0] ?? '') + (profile.lastName?.[0] ?? '')).trim() || profile.email?.[0] || 'U';

  return (
    <Button
      variant={isSelected ? 'secondary' : 'ghost'}
      className="flex h-auto w-full items-center justify-start p-3"
      onClick={onSelect}
    >
      <div className="flex items-center space-x-3 text-left">
        <Avatar>
          <AvatarImage src={profile.profileImage} alt={fullName} />
          <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold truncate">{fullName}</p>
          {profile.email && <p className="text-sm text-muted-foreground truncate">{profile.email}</p>}
        </div>
      </div>
    </Button>
  );
}

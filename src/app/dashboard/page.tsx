'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { CommunityList } from '@/components/communities/community-list';
import { MemberList } from '@/components/members/member-list';
import { MessageList } from '@/components/messages/message-list';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  usersList: { userId: string }[];
  [key: string]: any;
}

export default function Dashboard() {
  const { user } = useUser();
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    null
  );
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    setSelectedMemberId(null); // Reset member when community changes
    setSelectedMemberName(null);
  };

  const handleMemberSelect = (memberId: string, memberName: string) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
  };

  const handleBackToCommunities = () => {
    setSelectedCommunity(null);
    setSelectedMemberId(null);
    setSelectedMemberName(null);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-6xl">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Welcome, {user.email}!
            </p>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search communities..."
                className="w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div className="md:col-span-1 lg:col-span-1">
                <CommunityList
                  selectedCommunityId={selectedCommunity?.id ?? null}
                  onCommunitySelect={handleCommunitySelect}
                  searchTerm={searchTerm}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Card className='h-full'>
                  <CardContent className="pt-6 h-full">
                    {!selectedCommunity && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          Select a community to see its members.
                        </p>
                      </div>
                    )}
                    {selectedCommunity && !selectedMemberId && (
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <MemberList
                            usersList={selectedCommunity.usersList || []}
                            onMemberSelect={handleMemberSelect}
                          />
                           <div className="hidden lg:flex flex-col items-center justify-center h-full">
                              <p className="text-muted-foreground text-center">
                                Select a member to view their messages.
                              </p>
                            </div>
                       </div>
                    )}
                    {selectedCommunity && selectedMemberId && selectedMemberName &&(
                      <MessageList
                        userId={selectedMemberId}
                        userName={selectedMemberName}
                        onBack={() => setSelectedMemberId(null)}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

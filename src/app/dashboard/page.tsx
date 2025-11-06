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
  usersList: { userId: string; email?: string; name?: string }[];
  [key: string]: any;
}

export default function Dashboard() {
  const { user } = useUser();
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    setSelectedMember(null); // Reset member when community changes
    setMemberSearchTerm(''); // Reset member search
  };

  const handleMemberSelect = (memberId: string, memberName: string) => {
    setSelectedMember({ id: memberId, name: memberName });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {user && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-7xl">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Welcome, {user.email}!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Community List */}
              <div className="md:col-span-1 lg:col-span-1">
                <Card>
                  <CardContent className="pt-6">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search communities..."
                        className="w-full pl-10"
                        value={communitySearchTerm}
                        onChange={(e) => setCommunitySearchTerm(e.target.value)}
                      />
                    </div>
                    <CommunityList
                      selectedCommunityId={selectedCommunity?.id ?? null}
                      onCommunitySelect={handleCommunitySelect}
                      searchTerm={communitySearchTerm}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Member & Message Panel */}
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
                    {selectedCommunity && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        {/* Member List */}
                        <div className='flex flex-col'>
                           <div className="relative mb-4">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                type="search"
                                placeholder="Search members..."
                                className="w-full pl-10"
                                value={memberSearchTerm}
                                onChange={(e) => setMemberSearchTerm(e.target.value)}
                              />
                            </div>
                            <MemberList
                              communityId={selectedCommunity.id}
                              onMemberSelect={handleMemberSelect}
                              searchTerm={memberSearchTerm}
                              selectedMemberId={selectedMember?.id}
                              selectedCommunityId={selectedCommunity.id}
                            />
                        </div>

                        {/* Message List or Placeholder */}
                        <div className="flex flex-col h-full">
                          {!selectedMember && (
                              <div className="hidden lg:flex flex-col items-center justify-center h-full">
                                <p className="text-muted-foreground text-center">
                                  Select a member to view their messages.
                                </p>
                              </div>
                          )}
                          {selectedMember && user && (
                            <MessageList
                              currentUserId={user.uid}
                              selectedUserId={selectedMember.id}
                              selectedUserName={selectedMember.name}
                              selectedCommunityId={selectedCommunity.id}
                              onBack={() => setSelectedMember(null)}
                            />
                          )}
                        </div>
                      </div>
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

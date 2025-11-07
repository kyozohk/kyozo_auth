'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { CommunityList } from '@/components/communities/community-list';
import { MemberList } from '@/components/members/member-list';
import { MessageList } from '@/components/messages/message-list';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Community {
  id: string;
  name: string;
  usersList: { userId: string; email?: string; [key: string]: any; }[];
  [key: string]: any;
}

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
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

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };
  
  if (isUserLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user && (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-screen-2xl">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <div className="flex gap-2">
                <Link href="/inbox" passHref>
                  <Button variant="outline">Go to Inbox</Button>
                </Link>
                <Link href="/compare" passHref>
                  <Button variant="outline">Go to Compare</Button>
                </Link>
                <Link href="/mongo" passHref>
                  <Button variant="outline">Go to Mongo</Button>
                </Link>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-6">
              Welcome, {user.email}!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
              {/* Community List */}
              <div className="col-span-1">
                <Card className='h-full'>
                  <CardContent className="pt-6 h-full flex flex-col">
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
              <div className="col-span-1">
                <Card className='h-full'>
                  <CardContent className="pt-6 h-full flex flex-col">
                    {!selectedCommunity && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          Select a community to see its members.
                        </p>
                      </div>
                    )}
                    {selectedCommunity && (
                      <div className='flex flex-col h-full'>
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
                              members={selectedCommunity.usersList}
                              onMemberSelect={handleMemberSelect}
                              searchTerm={memberSearchTerm}
                              selectedMemberId={selectedMember?.id}
                            />
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-1">
                <Card className='h-full'>
                  <CardContent className="pt-6 h-full flex flex-col">
                    {!selectedMember && (
                        <div className="flex flex-col items-center justify-center h-full">
                          <p className="text-muted-foreground text-center">
                            Select a member to view their messages.
                          </p>
                        </div>
                    )}
                    {selectedMember && user && selectedCommunity && (
                      <MessageList
                        currentUserId={user.uid}
                        selectedUserId={selectedMember.id}
                        selectedUserName={selectedMember.name}
                        selectedCommunityId={selectedCommunity.id}
                        onBack={() => setSelectedMember(null)}
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

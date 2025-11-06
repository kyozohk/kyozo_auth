'use client';

import { useState, useEffect } from 'react';
import type { Community, Member, Message, UserProfile } from './actions';
import { getCommunities, getCommunityMembers, getMessages } from './actions';
import { CommunityListMongo } from '@/components/mongo/community-list-mongo';
import { MemberListMongo } from '@/components/mongo/member-list-mongo';
import { MessageListMongo } from '@/components/mongo/message-list-mongo';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useUser } from '@/firebase';

export default function MongoDashboard() {
  const { user, isUserLoading } = useUser();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [communitySearchTerm, setCommunitySearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    async function fetchCommunities() {
      setIsLoadingCommunities(true);
      try {
        const comms = await getCommunities();
        setCommunities(comms);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
      } finally {
        setIsLoadingCommunities(false);
      }
    }
    fetchCommunities();
  }, []);

  const handleCommunitySelect = async (community: Community) => {
    if (community._id === selectedCommunity?._id) return;
    setSelectedCommunity(community);
    setSelectedMember(null);
    setMessages([]);
    setIsLoadingMembers(true);
    setMembers([]);
    setUserProfiles({});
    try {
        const { members: fetchedMembers, profiles: fetchedProfiles } = await getCommunityMembers(community._id);
        setMembers(fetchedMembers);
        setUserProfiles(fetchedProfiles);
    } catch (error) {
        console.error('Failed to fetch members:', error);
        setMembers([]);
    } finally {
        setIsLoadingMembers(false);
    }
  };

  const handleMemberSelect = async (member: Member) => {
    if (!user || !selectedCommunity) return;
    setSelectedMember(member);
    setIsLoadingMessages(true);
    try {
        const msgs = await getMessages(selectedCommunity._id, user.uid, member.userId);
        setMessages(msgs);
    } catch(error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
    } finally {
        setIsLoadingMessages(false);
    }
  };
  
  if (isUserLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-7xl">
            <h1 className="text-3xl font-bold mb-2">Mongo Data Dashboard</h1>
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
                    <CommunityListMongo
                      communities={communities}
                      isLoading={isLoadingCommunities}
                      selectedCommunityId={selectedCommunity?._id ?? null}
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
                            <MemberListMongo
                              members={members}
                              profiles={userProfiles}
                              isLoading={isLoadingMembers}
                              onMemberSelect={handleMemberSelect}
                              searchTerm={memberSearchTerm}
                              selectedMemberId={selectedMember?.userId}
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
                            <MessageListMongo
                              messages={messages}
                              isLoading={isLoadingMessages}
                              profiles={userProfiles}
                              currentUserId={user.uid}
                              selectedMember={selectedMember}
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

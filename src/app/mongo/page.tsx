'use client';

import { useState, useEffect } from 'react';
import type { Community, Member, Message } from './actions';
import { getCommunities, getMembers, getMessagesForMember } from './actions';
import { CommunityListMongo } from '@/components/mongo/community-list-mongo';
import { MemberListMongo } from '@/components/mongo/member-list-mongo';
import { MessageListMongo } from '@/components/mongo/message-list-mongo';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/firebase';

export default function MongoDashboard() {
  const { user, isUserLoading } = useUser();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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
    if (community.id === selectedCommunity?.id) return;
    
    setSelectedCommunity(community);
    setSelectedMember(null);
    setMembers([]);
    setMessages([]);

    setIsLoadingMembers(true);
    try {
        const fetchedMembers = await getMembers(community.id);
        setMembers(fetchedMembers);
    } catch (error) {
        console.error('Failed to fetch members:', error);
        setMembers([]);
    } finally {
        setIsLoadingMembers(false);
    }
  };

  const handleMemberSelect = async (member: Member) => {
    if (!selectedCommunity || member.id === selectedMember?.id) return;

    setSelectedMember(member);
    setMessages([]);
    setIsLoadingMessages(true);
    try {
        const msgs = await getMessagesForMember(selectedCommunity.id, member.id);
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
          <div className="w-full max-w-screen-2xl">
            <h1 className="text-3xl font-bold mb-2">Mongo Data Dashboard</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Welcome, {user.email}!
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
              {/* Community List */}
              <div className="lg:col-span-1">
                <Card className='h-full'>
                  <CardContent className="pt-6 h-full flex flex-col">
                    <CommunityListMongo
                      communities={communities}
                      isLoading={isLoadingCommunities}
                      selectedCommunityId={selectedCommunity?.id ?? null}
                      onCommunitySelect={handleCommunitySelect}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Member List */}
               <div className="lg:col-span-1">
                <Card className='h-full'>
                  <CardContent className="pt-6 h-full flex flex-col">
                    {!selectedCommunity ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-muted-foreground">
                          Select a community to see its members.
                        </p>
                      </div>
                    ) : (
                      <MemberListMongo
                        members={members}
                        isLoading={isLoadingMembers}
                        onMemberSelect={handleMemberSelect}
                        selectedMemberId={selectedMember?.id}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Message List */}
              <div className="lg-col-span-1">
                <Card className='h-full'>
                  <CardContent className="pt-6 h-full flex flex-col">
                    {!selectedMember ? (
                      <div className="flex flex-col items-center justify-center h-full">
                          <p className="text-muted-foreground text-center">
                            Select a member to view their messages.
                          </p>
                      </div>
                    ) : (
                      <MessageListMongo
                        messages={messages}
                        isLoading={isLoadingMessages}
                        currentUserId={user.uid} // This might need to change depending on how you identify the current user in mongo
                        selectedMember={selectedMember}
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

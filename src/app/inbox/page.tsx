'use client';

import { useState, useEffect } from 'react';
import type { Community, Member, Message, CommunityMongo, MemberMongo, MessageMongo } from './actions';
import { 
    getCommunities, getMembers, getMessagesForMember,
    getCommunitiesMongo, getMembersMongo, getMessagesForMemberMongo
} from './actions';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { CommunityListInbox } from '@/components/inbox/community-list-inbox';
import { MemberListInbox } from '@/components/inbox/member-list-inbox';
import { MessageListInbox } from '@/components/inbox/message-list-inbox';

export default function InboxPage() {
  const { user, isUserLoading } = useUser();

  // Firestore State
  const [communities, setCommunities] = useState<Community[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // MongoDB State
  const [communitiesMongo, setCommunitiesMongo] = useState<CommunityMongo[]>([]);
  const [membersMongo, setMembersMongo] = useState<MemberMongo[]>([]);
  const [messagesMongo, setMessagesMongo] = useState<MessageMongo[]>([]);
  const [selectedCommunityMongo, setSelectedCommunityMongo] = useState<CommunityMongo | null>(null);
  const [selectedMemberMongo, setSelectedMemberMongo] = useState<MemberMongo | null>(null);
  const [isLoadingCommunitiesMongo, setIsLoadingCommunitiesMongo] = useState(true);
  const [isLoadingMembersMongo, setIsLoadingMembersMongo] = useState(false);
  const [isLoadingMessagesMongo, setIsLoadingMessagesMongo] = useState(false);

  useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingCommunities(true);
      setIsLoadingCommunitiesMongo(true);
      const [comms, commsMongo] = await Promise.all([
        getCommunities(),
        getCommunitiesMongo()
      ]);
      setCommunities(comms);
      setCommunitiesMongo(commsMongo);
      setIsLoadingCommunities(false);
      setIsLoadingCommunitiesMongo(false);
    }
    fetchInitialData();
  }, []);

  // --- Firestore Handlers ---
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
    } finally {
        setIsLoadingMessages(false);
    }
  };

  // --- MongoDB Handlers ---
  const handleCommunitySelectMongo = async (community: CommunityMongo) => {
    if (community.id === selectedCommunityMongo?.id) return;
    setSelectedCommunityMongo(community);
    setSelectedMemberMongo(null);
    setMembersMongo([]);
    setMessagesMongo([]);
    setIsLoadingMembersMongo(true);
    try {
        const fetchedMembers = await getMembersMongo(community.id);
        setMembersMongo(fetchedMembers);
    } finally {
        setIsLoadingMembersMongo(false);
    }
  };

  const handleMemberSelectMongo = async (member: MemberMongo) => {
    if (!selectedCommunityMongo || member.id === selectedMemberMongo?.id) return;
    setSelectedMemberMongo(member);
    setMessagesMongo([]);
    setIsLoadingMessagesMongo(true);
    try {
        const msgs = await getMessagesForMemberMongo(selectedCommunityMongo.id, member.id);
        setMessagesMongo(msgs);
    } finally {
        setIsLoadingMessagesMongo(false);
    }
  };

  if (isUserLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user && (
        <div className="flex flex-col items-center w-full">
          <div className="w-full max-w-screen-2xl">
            <h1 className="text-3xl font-bold mb-2">Inbox Comparison</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Compare Community, Member, and Message data between Firestore and MongoDB.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
              {/* Firestore Column */}
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-center">Firestore</h2>
                <Card className='h-full'>
                    <CardContent className="pt-6 h-full flex flex-col">
                        <CommunityListInbox
                            title="Communities"
                            communities={communities}
                            isLoading={isLoadingCommunities}
                            selectedCommunityId={selectedCommunity?.id}
                            onCommunitySelect={handleCommunitySelect}
                        />
                    </CardContent>
                </Card>
                <Card className='h-full'>
                    <CardContent className="pt-6 h-full flex flex-col">
                         <MemberListInbox
                            title="Members"
                            members={members}
                            isLoading={isLoadingMembers}
                            selectedMemberId={selectedMember?.id}
                            onMemberSelect={handleMemberSelect}
                            hasSelectedCommunity={!!selectedCommunity}
                         />
                    </CardContent>
                </Card>
                <Card className='h-full'>
                     <CardContent className="pt-6 h-full flex flex-col">
                        <MessageListInbox
                            title="Messages"
                            messages={messages}
                            isLoading={isLoadingMessages}
                            currentUserId={user.uid}
                            selectedMember={selectedMember}
                            onBack={() => setSelectedMember(null)}
                        />
                     </CardContent>
                </Card>
              </div>

              {/* MongoDB Column */}
               <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-center">MongoDB</h2>
                 <Card className='h-full'>
                    <CardContent className="pt-6 h-full flex flex-col">
                        <CommunityListInbox
                            title="Communities"
                            communities={communitiesMongo}
                            isLoading={isLoadingCommunitiesMongo}
                            selectedCommunityId={selectedCommunityMongo?.id}
                            onCommunitySelect={handleCommunitySelectMongo}
                            isMongo={true}
                        />
                    </CardContent>
                </Card>
                <Card className='h-full'>
                    <CardContent className="pt-6 h-full flex flex-col">
                         <MemberListInbox
                            title="Members"
                            members={membersMongo}
                            isLoading={isLoadingMembersMongo}
                            selectedMemberId={selectedMemberMongo?.id}
                            onMemberSelect={handleMemberSelectMongo}
                            hasSelectedCommunity={!!selectedCommunityMongo}
                            isMongo={true}
                         />
                    </CardContent>
                </Card>
                <Card className='h-full'>
                     <CardContent className="pt-6 h-full flex flex-col">
                        <MessageListInbox
                            title="Messages"
                            messages={messagesMongo}
                            isLoading={isLoadingMessagesMongo}
                            currentUserId={user.uid}
                            selectedMember={selectedMemberMongo}
                            onBack={() => setSelectedMemberMongo(null)}
                            isMongo={true}
                        />
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

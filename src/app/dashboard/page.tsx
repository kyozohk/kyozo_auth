'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { CommunityList } from '@/components/communities/community-list';
import { MemberList } from '@/components/members/member-list';
import { MessageList } from '@/components/messages/message-list';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    null
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    null
  );
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(
    null
  );

  const handleCommunitySelect = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setSelectedMemberId(null); // Reset member when community changes
    setSelectedMemberName(null);
  };

  const handleMemberSelect = (memberId: string, memberName: string) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
  };

  const handleBackToCommunities = () => {
    setSelectedCommunityId(null);
    setSelectedMemberId(null);
    setSelectedMemberName(null);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {user && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-5xl">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Welcome, {user.email}!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <CommunityList
                  selectedCommunityId={selectedCommunityId}
                  onCommunitySelect={handleCommunitySelect}
                />
              </div>
              <div className="md:col-span-2">
                <Card>
                  <CardContent className="pt-6">
                    {selectedCommunityId && !selectedMemberId && (
                      <MemberList
                        communityId={selectedCommunityId}
                        onMemberSelect={handleMemberSelect}
                        onBack={handleBackToCommunities}
                      />
                    )}
                    {selectedCommunityId && selectedMemberId && selectedMemberName &&(
                      <MessageList
                        userId={selectedMemberId}
                        userName={selectedMemberName}
                        onBack={() => setSelectedMemberId(null)}
                      />
                    )}
                    {!selectedCommunityId && (
                      <div className="flex flex-col items-center justify-center h-96">
                        <p className="text-muted-foreground">
                          Select a community to see its members.
                        </p>
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

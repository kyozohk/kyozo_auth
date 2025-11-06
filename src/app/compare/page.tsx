'use client';

import { useState, useEffect } from 'react';
import { getFirestoreCommunitiesWithMembers, getMongoCommunitiesWithMembers } from './actions';
import type { FirestoreCommunityWithMembers, MongoCommunityWithMembers } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


interface CommunityListProps {
    title: string;
    communities: (FirestoreCommunityWithMembers | MongoCommunityWithMembers)[];
    isLoading: boolean;
}

const CommunityList = ({ title, communities, isLoading }: CommunityListProps) => {
    const { toast } = useToast();

    const handleCopy = (community: any) => {
        navigator.clipboard.writeText(JSON.stringify(community, null, 2));
        toast({
            title: 'Copied to clipboard!',
            description: `${community.name} data has been copied.`,
        });
    };
    
    const renderSkeleton = () => (
        <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
        ))}
        </div>
    );

    return (
        <Card className='h-full'>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? renderSkeleton() : (
                    <ScrollArea className="h-[calc(100vh-14rem)]">
                        <Accordion type="single" collapsible className="w-full">
                            {communities.map((community) => (
                                <AccordionItem value={community.id} key={community.id}>
                                    <div className="flex items-center gap-2">
                                        <AccordionTrigger className="flex-1 text-left">
                                            {community.name} ({community.members.length} members)
                                        </AccordionTrigger>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 flex-shrink-0"
                                            onClick={() => handleCopy(community)}
                                            title="Copy full community and member JSON"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <AccordionContent>
                                       <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                                            {JSON.stringify(community, null, 2)}
                                       </pre>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                         {communities.length === 0 && <p className="text-muted-foreground p-4 text-center">No communities found.</p>}
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    )
}


export default function ComparePage() {
    const [firestoreCommunities, setFirestoreCommunities] = useState<FirestoreCommunityWithMembers[]>([]);
    const [mongoCommunities, setMongoCommunities] = useState<MongoCommunityWithMembers[]>([]);
    const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);
    const [isLoadingMongo, setIsLoadingMongo] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoadingFirestore(true);
            setIsLoadingMongo(true);
            const [fsData, mongoData] = await Promise.all([
                getFirestoreCommunitiesWithMembers(),
                getMongoCommunitiesWithMembers(),
            ]);
            setFirestoreCommunities(fsData);
            setMongoCommunities(mongoData);
            setIsLoadingFirestore(false);
            setIsLoadingMongo(false);
        }
        fetchData();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
             <h1 className="text-3xl font-bold mb-2">Compare Databases</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Compare community and member data between Firestore and MongoDB.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
                <CommunityList 
                    title="Firestore Communities"
                    communities={firestoreCommunities}
                    isLoading={isLoadingFirestore}
                />
                <CommunityList 
                    title="MongoDB Communities"
                    communities={mongoCommunities}
                    isLoading={isLoadingMongo}
                />
            </div>
        </div>
    );
}

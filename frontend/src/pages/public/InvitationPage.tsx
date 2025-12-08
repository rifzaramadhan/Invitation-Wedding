import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { publicApi, Wedding, Guest, Wish } from '../../api/client';
import { ThemeProvider } from '../../components/ThemeProvider';

import OpeningCover from '../../components/public/OpeningCover';
import Hero from '../../components/public/Hero';
import CoupleSection from '../../components/public/CoupleSection';
import EventTimeline from '../../components/public/EventTimeline';
import WishesSection from '../../components/public/WishesSection';
import GiftSection from '../../components/public/GiftSection';
import Footer from '../../components/public/Footer';
import MusicPlayer from '../../components/public/MusicPlayer';
import FloatingElements from '../../components/public/FloatingElements';

export default function InvitationPage() {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const guestSlug = searchParams.get('to');

    const [isOpened, setIsOpened] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Fetch wedding data
    const { data: weddingData, isLoading, error } = useQuery({
        queryKey: ['wedding', slug, guestSlug],
        queryFn: async () => {
            if (guestSlug) {
                const res = await publicApi.getWeddingWithGuest(slug!, guestSlug);
                return res.data as { wedding: Wedding; guest: Guest | null };
            }
            const res = await publicApi.getWedding(slug!);
            return { wedding: res.data.wedding as Wedding, guest: null };
        },
        enabled: !!slug,
    });

    // Fetch wishes
    const { data: wishesData } = useQuery({
        queryKey: ['wishes', slug],
        queryFn: async () => {
            const res = await publicApi.getWishes(slug!);
            return res.data.wishes as Wish[];
        },
        enabled: !!slug && isOpened,
    });

    // Update page title
    useEffect(() => {
        if (weddingData?.wedding) {
            const { groomName, brideName } = weddingData.wedding;
            document.title = `${groomName} & ${brideName} - Wedding Invitation`;
        }
    }, [weddingData]);

    const handleOpen = () => {
        setIsOpened(true);
        setIsPlaying(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center theme-gradient">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-secondary-600">Loading invitation...</p>
                </div>
            </div>
        );
    }

    if (error || !weddingData?.wedding) {
        return (
            <div className="min-h-screen flex items-center justify-center theme-gradient">
                <div className="text-center">
                    <p className="text-xl text-secondary-700 mb-2">Invitation not found</p>
                    <p className="text-secondary-500">The wedding invitation you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const { wedding, guest } = weddingData;

    return (
        <ThemeProvider themeId={wedding.theme}>
            <div className="min-h-screen theme-gradient theme-font-body">
                <AnimatePresence mode="wait">
                    {!isOpened && (
                        <OpeningCover
                            key="cover"
                            wedding={wedding}
                            guestName={guest?.name}
                            onOpen={handleOpen}
                        />
                    )}
                </AnimatePresence>

                {isOpened && (
                    <>
                        <FloatingElements />
                        <MusicPlayer
                            musicUrl={wedding.musicUrl}
                            isPlaying={isPlaying}
                            onToggle={() => setIsPlaying(!isPlaying)}
                        />

                        <main>
                            <Hero wedding={wedding} guestName={guest?.name} />
                            <CoupleSection wedding={wedding} />
                            <EventTimeline events={wedding.events || []} />
                            <WishesSection
                                slug={slug!}
                                wishes={wishesData || []}
                                guestName={guest?.name}
                                guestSlug={guest?.slug}
                                maxAttendees={guest?.maxAttendees}
                            />
                            {wedding.giftSettings && (
                                <GiftSection giftSettings={wedding.giftSettings} />
                            )}
                            <Footer groomName={wedding.groomName} brideName={wedding.brideName} />
                        </main>
                    </>
                )}
            </div>
        </ThemeProvider>
    );
}


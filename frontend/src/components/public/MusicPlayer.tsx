import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface MusicPlayerProps {
    musicUrl?: string;
    isPlaying: boolean;
    onToggle: () => void;
}

export default function MusicPlayer({ musicUrl, isPlaying, onToggle }: MusicPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        if (!audioRef.current || !musicUrl) return;

        if (isPlaying && hasInteracted) {
            audioRef.current.play().catch(console.error);
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, musicUrl, hasInteracted]);

    const handleToggle = () => {
        setHasInteracted(true);
        onToggle();
    };

    if (!musicUrl) return null;

    return (
        <>
            <audio ref={audioRef} src={musicUrl} loop preload="auto" />

            <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleToggle}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all group"
            >
                <motion.div
                    animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    {isPlaying ? (
                        <Volume2 className="w-6 h-6 text-primary-600" />
                    ) : (
                        <VolumeX className="w-6 h-6 text-secondary-400" />
                    )}
                </motion.div>

                {/* Sound waves animation */}
                {isPlaying && (
                    <div className="absolute inset-0 rounded-full">
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary-400"
                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary-300"
                            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        />
                    </div>
                )}
            </motion.button>
        </>
    );
}

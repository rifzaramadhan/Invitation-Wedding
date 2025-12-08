import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Wedding } from '../../api/client';

interface OpeningCoverProps {
    wedding: Wedding;
    guestName?: string;
    onOpen: () => void;
}

export default function OpeningCover({ wedding, guestName, onOpen }: OpeningCoverProps) {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                backgroundImage: wedding.coverImage
                    ? `url(${wedding.coverImage})`
                    : `linear-gradient(135deg, var(--theme-primary-light) 0%, var(--theme-secondary-light) 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative z-10 text-center px-6"
            >
                {/* Decorative element */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    className="mb-8"
                >
                    <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <Mail className="w-10 h-10 text-white" />
                    </div>
                </motion.div>

                {/* Wedding title */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-white/80 text-sm uppercase tracking-[0.3em] mb-4"
                >
                    The Wedding Of
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="theme-font-script text-5xl md:text-7xl text-white mb-6 text-shadow-lg"
                >
                    {wedding.groomName} & {wedding.brideName}
                </motion.h1>

                {/* Guest name */}
                {guestName && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="mb-8"
                    >
                        <p className="text-white/70 text-sm mb-2">Dear,</p>
                        <p className="text-white text-xl font-medium">{guestName}</p>
                    </motion.div>
                )}

                {/* Open button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpen}
                    className="px-8 py-4 rounded-full font-medium shadow-xl transition-all duration-300"
                    style={{
                        backgroundColor: 'var(--theme-primary)',
                        color: 'white',
                    }}
                >
                    Open Invitation
                </motion.button>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2"
                    >
                        <div className="w-1 h-2 bg-white/70 rounded-full" />
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}


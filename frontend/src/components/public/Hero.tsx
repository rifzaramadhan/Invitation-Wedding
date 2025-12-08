import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wedding } from '../../api/client';

interface HeroProps {
    wedding: Wedding;
    guestName?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
    const difference = new Date(targetDate).getTime() - new Date().getTime();

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
}

export default function Hero({ wedding, guestName }: HeroProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
        calculateTimeLeft(wedding.weddingDate)
    );

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(wedding.weddingDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [wedding.weddingDate]);

    const formattedDate = new Date(wedding.weddingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-200/30 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center max-w-3xl mx-auto"
            >
                {/* Greeting */}
                {guestName && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8"
                    >
                        <p className="text-secondary-500 mb-1">Dear</p>
                        <p className="text-xl font-medium text-secondary-700">{guestName}</p>
                        <p className="text-secondary-500 mt-2">You are cordially invited to our wedding</p>
                    </motion.div>
                )}

                {/* Couple names */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <p className="text-sm uppercase tracking-[0.3em] text-primary-600 mb-4">
                        The Wedding Of
                    </p>
                    <h1 className="font-script text-6xl md:text-8xl gradient-text mb-4">
                        {wedding.groomName}
                    </h1>
                    <p className="text-4xl text-gold-500 font-script mb-4">&</p>
                    <h1 className="font-script text-6xl md:text-8xl gradient-text">
                        {wedding.brideName}
                    </h1>
                </motion.div>

                {/* Date */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-secondary-600 mt-8 font-serif"
                >
                    {formattedDate}
                </motion.p>

                {/* Countdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 }}
                    className="mt-12 grid grid-cols-4 gap-4 max-w-md mx-auto"
                >
                    {[
                        { value: timeLeft.days, label: 'Days' },
                        { value: timeLeft.hours, label: 'Hours' },
                        { value: timeLeft.minutes, label: 'Minutes' },
                        { value: timeLeft.seconds, label: 'Seconds' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
                        >
                            <div className="text-3xl md:text-4xl font-bold gradient-text">
                                {String(item.value).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-secondary-500 uppercase tracking-wider mt-1">
                                {item.label}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-secondary-400"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </motion.div>
            </motion.div>
        </section>
    );
}

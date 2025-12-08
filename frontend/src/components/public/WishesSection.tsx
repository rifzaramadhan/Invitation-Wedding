import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Check, X, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { publicApi, Wish } from '../../api/client';

interface WishesSectionProps {
    slug: string;
    wishes: Wish[];
    guestName?: string;
    guestSlug?: string;
    maxAttendees?: number;
}

export default function WishesSection({
    slug,
    wishes,
    guestName,
    guestSlug,
    maxAttendees = 2,
}: WishesSectionProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: guestName || '',
        message: '',
        isAttending: null as boolean | null,
        attendeeCount: 1,
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const submitMutation = useMutation({
        mutationFn: (data: typeof formData) =>
            publicApi.submitWish(slug, {
                name: data.name,
                message: data.message,
                isAttending: data.isAttending ?? undefined,
                attendeeCount: data.isAttending ? data.attendeeCount : 0,
                guestSlug,
            }),
        onSuccess: () => {
            setIsSubmitted(true);
            queryClient.invalidateQueries({ queryKey: ['wishes', slug] });

            // Trigger confetti with theme colors
            const rootStyle = getComputedStyle(document.documentElement);
            const primaryColor = rootStyle.getPropertyValue('--theme-primary').trim();
            const accentColor = rootStyle.getPropertyValue('--theme-accent').trim();

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: [primaryColor || '#e06459', accentColor || '#cca01f', '#c9b7a6'],
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.message) return;
        submitMutation.mutate(formData);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <section
            className="py-20 px-6"
            style={{ background: `linear-gradient(to bottom, var(--theme-background), var(--theme-secondary-light))` }}
        >
            <div className="max-w-4xl mx-auto">
                {/* Section title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <p
                        className="text-sm uppercase tracking-[0.3em] mb-2"
                        style={{ color: 'var(--theme-primary)' }}
                    >
                        RSVP & Wishes
                    </p>
                    <h2 className="text-3xl md:text-4xl theme-font-heading theme-text">Send Your Wishes</h2>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <AnimatePresence mode="wait">
                            {isSubmitted ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="theme-card rounded-2xl p-6 shadow-lg text-center py-12"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-medium theme-text mb-2">
                                        Thank You!
                                    </h3>
                                    <p className="theme-text-light">
                                        Your wish has been sent. We appreciate your kind words!
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="theme-card rounded-2xl p-6 shadow-lg space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium theme-text mb-1">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>

                                    {/* Attendance */}
                                    <div>
                                        <label className="block text-sm font-medium theme-text mb-2">
                                            Will you attend?
                                        </label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isAttending: true })}
                                                className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.isAttending === true
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-secondary-200 hover:border-secondary-300'
                                                    }`}
                                            >
                                                <Check className="w-5 h-5 mx-auto mb-1" />
                                                <span className="text-sm">Yes, I'll be there</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isAttending: false })}
                                                className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.isAttending === false
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : 'border-secondary-200 hover:border-secondary-300'
                                                    }`}
                                            >
                                                <X className="w-5 h-5 mx-auto mb-1" />
                                                <span className="text-sm">Sorry, can't make it</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Number of guests */}
                                    {formData.isAttending && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                        >
                                            <label className="block text-sm font-medium theme-text mb-1">
                                                Number of attendees (max {maxAttendees})
                                            </label>
                                            <select
                                                value={formData.attendeeCount}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, attendeeCount: parseInt(e.target.value) })
                                                }
                                                className="input"
                                            >
                                                {Array.from({ length: maxAttendees }, (_, i) => i + 1).map((num) => (
                                                    <option key={num} value={num}>
                                                        {num} {num === 1 ? 'person' : 'people'}
                                                    </option>
                                                ))}
                                            </select>
                                        </motion.div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium theme-text mb-1">
                                            Your Message
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="input min-h-[120px] resize-none"
                                            placeholder="Write your wishes for the couple..."
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitMutation.isPending}
                                        className="theme-btn w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium"
                                    >
                                        {submitMutation.isPending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Wishes
                                            </>
                                        )}
                                    </button>

                                    {submitMutation.isError && (
                                        <p className="text-red-500 text-sm text-center">
                                            Failed to send. Please try again.
                                        </p>
                                    )}
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Wishes list */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="theme-card rounded-2xl p-6 shadow-lg max-h-[500px] overflow-y-auto"
                    >
                        <h3 className="font-medium theme-text mb-4 sticky top-0 backdrop-blur-sm py-2" style={{ backgroundColor: 'var(--theme-background)' }}>
                            Wishes from Guests ({wishes.length})
                        </h3>

                        {wishes.length === 0 ? (
                            <div className="text-center py-8 theme-text-light">
                                <p>No wishes yet. Be the first to send your wishes!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wishes.map((wish, index) => (
                                    <motion.div
                                        key={wish.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="border-b pb-4 last:border-0"
                                        style={{ borderColor: 'var(--theme-secondary-light)' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ background: `linear-gradient(to bottom right, var(--theme-primary-light), var(--theme-accent-light))` }}
                                            >
                                                <User className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium theme-text">{wish.name}</span>
                                                    {wish.isAttending !== null && (
                                                        <span
                                                            className={`text-xs px-2 py-0.5 rounded-full ${wish.isAttending
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}
                                                        >
                                                            {wish.isAttending ? 'Attending' : 'Not attending'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="theme-text-light text-sm whitespace-pre-line">
                                                    {wish.message}
                                                </p>
                                                <p className="text-xs theme-text-light opacity-60 mt-1">
                                                    {formatDate(wish.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}


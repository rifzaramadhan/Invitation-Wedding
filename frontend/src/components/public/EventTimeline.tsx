import { motion } from 'framer-motion';
import { MapPin, Clock, ExternalLink } from 'lucide-react';
import { Event } from '../../api/client';

interface EventTimelineProps {
    events: Event[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
    if (events.length === 0) return null;

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Jakarta',
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Jakarta',
        });
    };

    return (
        <section
            className="py-20 px-6"
            style={{ background: `linear-gradient(to bottom, var(--theme-secondary-light), var(--theme-background))` }}
        >
            <div className="max-w-4xl mx-auto">
                {/* Section title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p
                        className="text-sm uppercase tracking-[0.3em] mb-2"
                        style={{ color: 'var(--theme-primary)' }}
                    >
                        Save The Date
                    </p>
                    <h2 className="text-3xl md:text-4xl theme-font-heading theme-text">Wedding Events</h2>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                    {/* Timeline line */}
                    <div
                        className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block"
                        style={{ background: `linear-gradient(to bottom, var(--theme-primary), var(--theme-accent), var(--theme-primary))` }}
                    />

                    {events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className={`relative mb-12 md:mb-16 ${index % 2 === 0 ? 'md:pr-1/2 md:text-right' : 'md:pl-1/2 md:ml-auto'
                                }`}
                        >
                            {/* Timeline dot */}
                            <div
                                className="hidden md:block absolute left-1/2 top-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-lg z-10"
                                style={{ backgroundColor: 'var(--theme-accent)' }}
                            />

                            {/* Event card */}
                            <div
                                className={`theme-card rounded-2xl p-6 shadow-lg max-w-lg ${index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
                                    }`}
                            >
                                {/* Event icon */}
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0"
                                    style={{ background: `linear-gradient(to bottom right, var(--theme-primary-light), var(--theme-accent-light))` }}
                                >
                                    <span className="text-3xl">
                                        {event.title.toLowerCase().includes('akad') ? '💍' :
                                            event.title.toLowerCase().includes('resepsi') ? '🎊' :
                                                event.title.toLowerCase().includes('ceremony') ? '💒' :
                                                    event.title.toLowerCase().includes('reception') ? '🍾' : '📅'}
                                    </span>
                                </div>

                                <h3 className="text-2xl theme-font-heading theme-text mb-2">
                                    {event.title}
                                </h3>

                                <div className="space-y-2 theme-text-light">
                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                        <Clock className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                                        <span className="text-sm">
                                            {formatDate(event.startTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                        <Clock className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                                        <span className="text-sm">
                                            {formatTime(event.startTime)}
                                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2 justify-center md:justify-start">
                                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-accent)' }} />
                                        <span className="text-sm">{event.location}</span>
                                    </div>
                                    {event.address && (
                                        <p className="text-sm opacity-70 pl-6">
                                            {event.address}
                                        </p>
                                    )}
                                </div>

                                {event.description && (
                                    <p className="text-sm theme-text-light opacity-70 mt-4">
                                        {event.description}
                                    </p>
                                )}

                                {event.locationUrl && (
                                    <a
                                        href={event.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-4 transition-colors"
                                        style={{ color: 'var(--theme-primary)' }}
                                    >
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">View on Google Maps</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}


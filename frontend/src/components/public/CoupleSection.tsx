import { motion } from 'framer-motion';
import { Wedding } from '../../api/client';

interface CoupleSectionProps {
    wedding: Wedding;
}

export default function CoupleSection({ wedding }: CoupleSectionProps) {
    return (
        <section className="py-20 px-6 relative overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to bottom, transparent, var(--theme-secondary-light), transparent)` }}
            />

            <div className="max-w-5xl mx-auto relative z-10">
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
                        Bride & Groom
                    </p>
                    <h2 className="text-3xl md:text-4xl theme-font-heading theme-text">We're Getting Married</h2>
                </motion.div>

                {/* Couple cards */}
                <div className="grid md:grid-cols-2 gap-12 md:gap-8">
                    {/* Groom */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="relative mb-6 inline-block">
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden mx-auto border-4 border-white shadow-xl">
                                {wedding.groomPhoto ? (
                                    <img
                                        src={wedding.groomPhoto}
                                        alt={wedding.groomName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ background: `linear-gradient(to bottom right, var(--theme-secondary-light), var(--theme-primary-light))` }}
                                    >
                                        <span className="text-6xl">🤵</span>
                                    </div>
                                )}
                            </div>
                            {/* Decorative ring */}
                            <div
                                className="absolute -inset-2 rounded-full border-2 border-dashed animate-spin"
                                style={{ borderColor: 'var(--theme-accent)', animationDuration: '20s' }}
                            />
                        </div>

                        <h3 className="theme-font-script text-4xl theme-text mb-2">
                            {wedding.groomFullName || wedding.groomName}
                        </h3>
                        {wedding.groomParents && (
                            <p className="text-sm theme-text-light">
                                Son of {wedding.groomParents}
                            </p>
                        )}
                    </motion.div>

                    {/* Bride */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-center"
                    >
                        <div className="relative mb-6 inline-block">
                            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden mx-auto border-4 border-white shadow-xl">
                                {wedding.bridePhoto ? (
                                    <img
                                        src={wedding.bridePhoto}
                                        alt={wedding.brideName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        style={{ background: `linear-gradient(to bottom right, var(--theme-primary-light), var(--theme-accent-light))` }}
                                    >
                                        <span className="text-6xl">👰</span>
                                    </div>
                                )}
                            </div>
                            <div
                                className="absolute -inset-2 rounded-full border-2 border-dashed animate-spin"
                                style={{ borderColor: 'var(--theme-accent)', animationDuration: '20s', animationDirection: 'reverse' }}
                            />
                        </div>

                        <h3 className="theme-font-script text-4xl theme-text mb-2">
                            {wedding.brideFullName || wedding.brideName}
                        </h3>
                        {wedding.brideParents && (
                            <p className="text-sm theme-text-light">
                                Daughter of {wedding.brideParents}
                            </p>
                        )}
                    </motion.div>
                </div>

                {/* Love story */}
                {wedding.story && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-16 text-center max-w-2xl mx-auto"
                    >
                        <div className="inline-block mb-4">
                            <span className="text-5xl">💕</span>
                        </div>
                        <h3 className="text-2xl theme-font-heading theme-text mb-4">Our Love Story</h3>
                        <p className="theme-text-light leading-relaxed whitespace-pre-line">
                            {wedding.story}
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}


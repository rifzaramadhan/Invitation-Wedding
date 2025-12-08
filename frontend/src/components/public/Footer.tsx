import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FooterProps {
    groomName: string;
    brideName: string;
}

export default function Footer({ groomName, brideName }: FooterProps) {
    return (
        <footer
            className="py-16 px-6"
            style={{ background: `linear-gradient(to bottom, var(--theme-background), var(--theme-secondary-light))` }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto text-center"
            >
                {/* Thank you message */}
                <div className="mb-8">
                    <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--theme-primary)' }} />
                    <h2 className="theme-font-script text-4xl md:text-5xl theme-gradient-text mb-4">
                        Thank You
                    </h2>
                    <p className="theme-text-light leading-relaxed">
                        We are grateful for your presence and prayers. Your blessing means the world to us.
                        We look forward to celebrating this special day with you.
                    </p>
                </div>

                {/* Couple names */}
                <div className="border-t pt-8" style={{ borderColor: 'var(--theme-secondary)' }}>
                    <p className="text-sm theme-text-light mb-2">With love,</p>
                    <p className="theme-font-script text-3xl theme-text">
                        {groomName} & {brideName}
                    </p>
                </div>

                {/* Copyright */}
                <div className="mt-12 text-xs theme-text-light opacity-70">
                    <p>Made with ❤️ for our special day</p>
                    <p className="mt-1">© {new Date().getFullYear()} Wedding Invitation</p>
                </div>
            </motion.div>
        </footer>
    );
}


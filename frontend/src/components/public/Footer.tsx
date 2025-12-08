import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface FooterProps {
    groomName: string;
    brideName: string;
}

export default function Footer({ groomName, brideName }: FooterProps) {
    return (
        <footer className="py-16 px-6 bg-gradient-to-b from-white to-secondary-100">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto text-center"
            >
                {/* Thank you message */}
                <div className="mb-8">
                    <Heart className="w-8 h-8 text-primary-500 mx-auto mb-4" />
                    <h2 className="font-script text-4xl md:text-5xl gradient-text mb-4">
                        Thank You
                    </h2>
                    <p className="text-secondary-600 leading-relaxed">
                        We are grateful for your presence and prayers. Your blessing means the world to us.
                        We look forward to celebrating this special day with you.
                    </p>
                </div>

                {/* Couple names */}
                <div className="border-t border-secondary-200 pt-8">
                    <p className="text-sm text-secondary-500 mb-2">With love,</p>
                    <p className="font-script text-3xl text-secondary-700">
                        {groomName} & {brideName}
                    </p>
                </div>

                {/* Copyright */}
                <div className="mt-12 text-xs text-secondary-400">
                    <p>Made with ❤️ for our special day</p>
                    <p className="mt-1">© {new Date().getFullYear()} Wedding Invitation</p>
                </div>
            </motion.div>
        </footer>
    );
}

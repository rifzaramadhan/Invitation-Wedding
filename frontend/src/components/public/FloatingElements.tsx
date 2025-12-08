import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FloatingElement {
    id: number;
    x: number;
    delay: number;
    duration: number;
    size: number;
    emoji: string;
}

export default function FloatingElements() {
    const [elements, setElements] = useState<FloatingElement[]>([]);

    useEffect(() => {
        const emojis = ['💕', '💖', '💗', '✨', '🌸', '🌺', '🌷', '💐'];
        const newElements: FloatingElement[] = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 10,
            duration: 15 + Math.random() * 10,
            size: 16 + Math.random() * 16,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
        }));
        setElements(newElements);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {elements.map((el) => (
                <motion.div
                    key={el.id}
                    className="absolute"
                    style={{
                        left: `${el.x}%`,
                        fontSize: el.size,
                    }}
                    initial={{ y: '100vh', opacity: 0 }}
                    animate={{
                        y: '-100px',
                        opacity: [0, 1, 1, 0],
                        x: [0, 20, -20, 10, -10, 0],
                    }}
                    transition={{
                        duration: el.duration,
                        delay: el.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    {el.emoji}
                </motion.div>
            ))}
        </div>
    );
}

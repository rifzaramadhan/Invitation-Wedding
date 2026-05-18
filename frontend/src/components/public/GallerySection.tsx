import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

export interface GalleryImage {
    url: string;
    alt: string;
    width?: number;
    height?: number;
}

interface GallerySectionProps {
    images: GalleryImage[];
    title?: string;
    description?: string;
}

// Helper to get bento grid classes based on index
const getSpanClasses = (index: number) => {
    // Pattern loop of 10
    const i = index % 10;

    // Desktop spans (md:...)
    // Mobile is simpler: usually spans 1, sometimes 2 for big items

    switch (i) {
        case 0: // Big featured item
            return "md:col-span-2 md:row-span-2 col-span-2 row-span-2";
        case 3: // Tall vertical item
            return "md:col-span-1 md:row-span-2 col-span-1 row-span-2";
        case 6: // Wide horizontal item
            return "md:col-span-2 md:row-span-1 col-span-2 row-span-1";
        default: // Standard square
            return "md:col-span-1 md:row-span-1 col-span-1 row-span-1";
    }
};

export default function GallerySection({
    images,
    title = "Our Moments",
    description = "Capturing the beautiful journey of our love."
}: GallerySectionProps) {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="font-serif text-3xl md:text-4xl text-secondary-900 mb-4">
                        {title}
                    </h2>
                    <p className="text-secondary-600 max-w-2xl mx-auto font-light">
                        {description}
                    </p>
                </motion.div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
                    {images.map((image, index) => (
                        <GalleryItem
                            key={image.url}
                            image={image}
                            index={index}
                            className={getSpanClasses(index)}
                            onSelect={() => setSelectedImage(image)}
                        />
                    ))}
                </div>

                {/* Lightbox */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                            onClick={() => setSelectedImage(null)}
                        >
                            <button
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <motion.div
                                layoutId={`image-${selectedImage.url}`}
                                className="relative max-w-5xl w-full max-h-[90vh] rounded-lg overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.alt}
                                    className="w-full h-full object-contain max-h-[90vh]"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                    <p className="font-medium text-lg">{selectedImage.alt}</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

interface GalleryItemProps {
    image: GalleryImage;
    index: number;
    className?: string;
    onSelect: () => void;
}

function GalleryItem({ image, index, className = "", onSelect }: GalleryItemProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 * (index % 10) }}
            className={`relative group cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 bg-secondary-100 ${className}`}
            onClick={onSelect}
            layoutId={`image-${image.url}`}
        >
            {/* Skeleton Loader */}
            {isLoading && (
                <div className="absolute inset-0 bg-secondary-200 animate-pulse" />
            )}

            <img
                src={image.url}
                alt={image.alt}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'
                    }`}
            />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="bg-white/90 p-2.5 rounded-full text-secondary-900 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                    <ZoomIn className="w-5 h-5" />
                </span>
            </div>
        </motion.div>
    );
}

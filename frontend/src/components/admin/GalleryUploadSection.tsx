import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, Plus } from 'lucide-react';
import { GalleryImage, MediaUploadMeta, weddingsApi } from '../../api/client';
import FileUpload from './FileUpload';

interface GalleryUploadSectionProps {
    weddingId: string;
    images: GalleryImage[];
    onUpdate: () => void;
}

export default function GalleryUploadSection({
    weddingId,
    images,
    onUpdate,
}: GalleryUploadSectionProps) {
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [pendingMediaId, setPendingMediaId] = useState<string | null>(null);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string>('');

    const handleUpload = async (_url: string, meta?: MediaUploadMeta) => {
        if (!meta?.mediaId) return;

        try {
            setError(null);
            await weddingsApi.addGalleryPhoto(weddingId, {
                mediaId: meta.mediaId,
                order: images.length,
            });
            setPendingMediaId(null);
            setPendingPreviewUrl('');
            onUpdate();
        } catch (err) {
            console.error('Failed to add photo:', err);
            setError('Failed to save photo to gallery');
        }
    };

    const handlePendingChange = (url: string, meta?: MediaUploadMeta) => {
        setPendingPreviewUrl(url);
        setPendingMediaId(meta?.mediaId ?? null);

        if (meta?.mediaId && url) {
            void handleUpload(url, meta);
        } else if (!url) {
            setPendingMediaId(null);
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            setIsDeleting(imageId);
            setError(null);
            await weddingsApi.deleteGalleryPhoto(imageId);
            onUpdate();
        } catch (err) {
            console.error('Failed to delete photo:', err);
            setError('Failed to delete photo');
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-secondary-900">
                    Photo Gallery
                </h3>
                <span className="text-sm text-secondary-500">
                    {images.length} photos
                </span>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                {error}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatePresence>
                    {images.map((image) => (
                        <motion.div
                            key={image.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative aspect-square group"
                        >
                            <img
                                src={image.url.startsWith('/api/')
                                    ? `${import.meta.env.VITE_API_URL || ''}${image.url}`
                                    : image.url}
                                alt={image.alt || 'Gallery photo'}
                                className="w-full h-full object-cover rounded-lg border border-secondary-200"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(image.id)}
                                    disabled={isDeleting === image.id}
                                    className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                >
                                    {isDeleting === image.id ? (
                                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <div className="aspect-square">
                    <FileUpload
                        type="image"
                        value={pendingPreviewUrl}
                        mediaId={pendingMediaId ?? undefined}
                        onChange={handlePendingChange}
                        label="Add Photo"
                    />
                </div>
            </div>

            {images.length === 0 && (
                <div className="text-center py-10 bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200">
                    <div className="w-12 h-12 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-secondary-400" />
                    </div>
                    <p className="text-secondary-600">No photos yet</p>
                    <p className="text-sm text-secondary-400 mt-1">Upload photos to show in the gallery collage</p>
                </div>
            )}
        </div>
    );
}

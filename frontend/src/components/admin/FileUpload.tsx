import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadsApi } from '../../api/client';

interface FileUploadProps {
    type: 'image' | 'audio';
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    accept?: string;
}

export default function FileUpload({
    type,
    value,
    onChange,
    label,
    accept,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultAccept = type === 'image'
        ? 'image/jpeg,image/png,image/webp,image/gif'
        : 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a';

    const maxSize = type === 'image' ? 10 : 20; // MB

    const handleUpload = useCallback(async (file: File) => {
        setError(null);
        setProgress(0);

        // Validate file size
        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`File too large. Maximum size is ${maxSize}MB.`);
            return;
        }

        setIsUploading(true);

        try {
            // Upload directly to backend local storage
            const { data } = await uploadsApi.uploadFile(file, type, (percent) => {
                setProgress(percent);
            });

            // Return the public URL
            onChange(data.publicUrl);
            setProgress(100);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    }, [type, maxSize, onChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleUpload(file);
        }
    }, [handleUpload]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    }, [handleUpload]);

    const handleRemove = useCallback(async () => {
        if (!value) return;

        // If it's a key (starts with /api/uploads/file/), extract and delete
        if (value.startsWith('/api/uploads/file/')) {
            const key = decodeURIComponent(value.replace('/api/uploads/file/', ''));
            try {
                await uploadsApi.deleteFile(key);
            } catch (err) {
                console.error('Failed to delete file:', err);
            }
        }

        onChange('');
    }, [value, onChange]);

    const getPreviewUrl = () => {
        if (!value) return null;
        // If it's a relative path (from our proxy), prepend the API URL
        if (value.startsWith('/api/')) {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            return `${apiUrl}${value}`;
        }
        return value;
    };

    const getFileName = () => {
        if (!value) return null;
        // Extract filename from URL or key
        const parts = value.split('/');
        const lastPart = parts[parts.length - 1];
        // Remove UUID prefix if present
        const match = lastPart.match(/^[a-f0-9-]+-(.+)$/);
        return match ? match[1] : lastPart;
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-secondary-700">
                    {label}
                </label>
            )}

            {/* Upload area or preview */}
            <div className="relative">
                {value && !isUploading ? (
                    // Preview
                    <div className="relative rounded-xl border border-secondary-200 bg-secondary-50 p-4">
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 z-10 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {type === 'image' ? (
                            <div className="flex items-center gap-4">
                                <img
                                    src={getPreviewUrl() || ''}
                                    alt="Preview"
                                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">Error</text></svg>';
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-secondary-800 truncate">
                                        {getFileName()}
                                    </p>
                                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Uploaded successfully
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-secondary-800 truncate">
                                        {getFileName()}
                                    </p>
                                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Uploaded successfully
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Upload zone
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`
                            relative cursor-pointer rounded-xl border-2 border-dashed p-6
                            transition-all duration-200 text-center
                            ${isDragging
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-secondary-200 hover:border-primary-400 hover:bg-secondary-50'
                            }
                            ${isUploading ? 'pointer-events-none' : ''}
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={accept || defaultAccept}
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {isUploading ? (
                            <div className="space-y-3">
                                <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-secondary-700">
                                        Uploading...
                                    </p>
                                    <div className="mt-2 h-2 bg-secondary-200 rounded-full overflow-hidden max-w-xs mx-auto">
                                        <motion.div
                                            className="h-full bg-primary-600"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.2 }}
                                        />
                                    </div>
                                    <p className="text-xs text-secondary-500 mt-1">{progress}%</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="w-12 h-12 mx-auto rounded-full bg-secondary-100 flex items-center justify-center">
                                    {type === 'image' ? (
                                        <Image className="w-6 h-6 text-secondary-500" />
                                    ) : (
                                        <Music className="w-6 h-6 text-secondary-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-secondary-700">
                                        <span className="text-primary-600">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-secondary-500 mt-1">
                                        {type === 'image'
                                            ? 'PNG, JPG, WebP or GIF (max 10MB)'
                                            : 'MP3, WAV, OGG or AAC (max 20MB)'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2 flex items-center gap-2 text-sm text-red-600"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

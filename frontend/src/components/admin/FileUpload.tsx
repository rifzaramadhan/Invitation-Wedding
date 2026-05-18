import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { mediaApi, MediaUploadMeta } from '../../api/client';

interface FileUploadProps {
    type: 'image' | 'audio';
    value?: string;
    mediaId?: string;
    onChange: (url: string, meta?: MediaUploadMeta) => void;
    label?: string;
    accept?: string;
    deferCommit?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || '';

function resolvePublicUrl(url: string): string {
    if (url.startsWith('/api/')) {
        return `${API_URL}${url}`;
    }
    return url;
}

function isTemporaryUrl(url: string): boolean {
    return url.includes('/tmp/');
}

export default function FileUpload({
    type,
    value,
    mediaId,
    onChange,
    label,
    accept,
    deferCommit = true,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [currentMediaId, setCurrentMediaId] = useState<string | undefined>(mediaId);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const localPreviewRef = useRef<string | null>(null);

    const defaultAccept = type === 'image'
        ? 'image/jpeg,image/png,image/webp,image/gif'
        : 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a';

    const maxSize = type === 'image' ? 10 : 20;

    const revokeLocalPreview = useCallback(() => {
        if (localPreviewRef.current) {
            URL.revokeObjectURL(localPreviewRef.current);
            localPreviewRef.current = null;
        }
    }, []);

    useEffect(() => {
        setCurrentMediaId(mediaId);
    }, [mediaId]);

    useEffect(() => {
        if (!value) {
            revokeLocalPreview();
            setPreviewUrl(null);
            return;
        }

        if (localPreviewRef.current) {
            setPreviewUrl(localPreviewRef.current);
            return;
        }

        let objectUrl: string | null = null;
        let cancelled = false;

        const loadPreview = async () => {
            if (isTemporaryUrl(value) && (currentMediaId || mediaId)) {
                try {
                    const response = await mediaApi.preview(currentMediaId || mediaId!);
                    if (cancelled) return;
                    objectUrl = URL.createObjectURL(response.data);
                    setPreviewUrl(objectUrl);
                } catch (err) {
                    console.error('Failed to load temporary preview:', err);
                    if (!cancelled) {
                        setPreviewUrl(null);
                    }
                }
                return;
            }

            setPreviewUrl(resolvePublicUrl(value));
        };

        void loadPreview();

        return () => {
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [value, currentMediaId, mediaId, revokeLocalPreview]);

    const handleUpload = useCallback(async (file: File) => {
        setError(null);
        setProgress(0);

        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`File too large. Maximum size is ${maxSize}MB.`);
            return;
        }

        revokeLocalPreview();
        const localPreview = URL.createObjectURL(file);
        localPreviewRef.current = localPreview;
        setPreviewUrl(localPreview);
        setDisplayName(file.name);
        setIsUploading(true);

        try {
            if (deferCommit) {
                const { data } = await mediaApi.uploadTemp(file, type, (percent) => {
                    setProgress(percent);
                });

                setCurrentMediaId(data.id);
                setDisplayName(data.originalFilename);
                onChange(data.previewUrl, {
                    mediaId: data.id,
                    isTemporary: true,
                    previewUrl: data.previewUrl,
                });
            } else {
                const { uploadsApi } = await import('../../api/client');
                const { data } = await uploadsApi.uploadFile(file, type, (percent) => {
                    setProgress(percent);
                });

                revokeLocalPreview();
                setCurrentMediaId(undefined);
                setDisplayName(file.name);
                onChange(data.publicUrl, { isTemporary: false });
            }

            setProgress(100);
        } catch (err) {
            revokeLocalPreview();
            setPreviewUrl(null);
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    }, [type, maxSize, onChange, deferCommit, revokeLocalPreview]);

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
        e.target.value = '';
    }, [handleUpload]);

    const handleRemove = useCallback(async () => {
        if (currentMediaId && deferCommit) {
            try {
                await mediaApi.delete(currentMediaId);
            } catch (err) {
                console.error('Failed to delete temporary media:', err);
            }
        } else if (value?.startsWith('/api/uploads/file/') && !isTemporaryUrl(value)) {
            const key = decodeURIComponent(value.replace('/api/uploads/file/', ''));
            try {
                const { uploadsApi } = await import('../../api/client');
                await uploadsApi.deleteFile(key);
            } catch (err) {
                console.error('Failed to delete file:', err);
            }
        }

        revokeLocalPreview();
        setCurrentMediaId(undefined);
        setDisplayName(null);
        setPreviewUrl(null);
        onChange('', { isTemporary: false });
    }, [value, currentMediaId, deferCommit, onChange, revokeLocalPreview]);

    useEffect(() => () => revokeLocalPreview(), [revokeLocalPreview]);

    const getFileName = () => {
        if (displayName) return displayName;
        if (!value) return null;
        const parts = value.split('/');
        const lastPart = parts[parts.length - 1];
        const match = lastPart.match(/^[a-f0-9-]+-(.+)$/);
        return match ? match[1] : lastPart;
    };

    const isPending = Boolean(value && deferCommit && currentMediaId);

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-secondary-700">
                    {label}
                </label>
            )}

            <div className="relative">
                {value && !isUploading ? (
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
                                    src={previewUrl || ''}
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
                                    <p className={`text-xs flex items-center gap-1 mt-1 ${isPending ? 'text-amber-600' : 'text-green-600'}`}>
                                        <CheckCircle className="w-3 h-3" />
                                        {isPending ? 'Uploaded (save to confirm)' : 'Uploaded successfully'}
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
                                    <p className={`text-xs flex items-center gap-1 mt-1 ${isPending ? 'text-amber-600' : 'text-green-600'}`}>
                                        <CheckCircle className="w-3 h-3" />
                                        {isPending ? 'Uploaded (save to confirm)' : 'Uploaded successfully'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
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
                                {type === 'image' && previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Upload preview"
                                        className="w-20 h-20 mx-auto object-cover rounded-lg shadow-sm opacity-80"
                                    />
                                ) : (
                                    <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
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

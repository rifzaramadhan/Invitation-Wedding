import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    Plus,
    Trash2,
    Copy,
    Check,
    Upload,
    MessageCircle,
    X,
} from 'lucide-react';
import { guestsApi, weddingsApi, Guest } from '../../api/client';

export default function GuestListPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [newGuest, setNewGuest] = useState({ name: '', slug: '', maxAttendees: 2 });
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [whatsappModal, setWhatsappModal] = useState<{ guest: Guest; message: string } | null>(null);
    const [whatsappCopied, setWhatsappCopied] = useState(false);

    // Fetch wedding info
    const { data: weddingData } = useQuery({
        queryKey: ['wedding', id],
        queryFn: async () => {
            const res = await weddingsApi.get(id!);
            return res.data.wedding;
        },
    });

    // Fetch guests
    const { data: guestsData, isLoading } = useQuery({
        queryKey: ['guests', id],
        queryFn: async () => {
            const res = await guestsApi.list(id!);
            return res.data.guests as Guest[];
        },
    });

    // Create guest mutation
    const createMutation = useMutation({
        mutationFn: () => guestsApi.create(id!, newGuest),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guests', id] });
            setNewGuest({ name: '', slug: '', maxAttendees: 2 });
        },
    });

    // Bulk create mutation
    const bulkCreateMutation = useMutation({
        mutationFn: () => {
            const guests = bulkText
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => {
                    const name = line.trim();
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    return { name, slug, maxAttendees: 2 };
                });
            return guestsApi.bulkCreate(id!, guests);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guests', id] });
            setShowBulkModal(false);
            setBulkText('');
        },
    });

    // Delete guest mutation
    const deleteMutation = useMutation({
        mutationFn: (guestId: string) => guestsApi.delete(guestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guests', id] });
        },
    });

    const copyLink = async (guest: Guest) => {
        const url = `${window.location.origin}/${weddingData?.slug}?to=${guest.slug}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(guest.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Generate WhatsApp message for a guest
    const generateWhatsappMessage = (guest: Guest) => {
        const url = `${window.location.origin}/${weddingData?.slug}?to=${guest.slug}`;
        const groomName = weddingData?.groomName || 'Groom';
        const brideName = weddingData?.brideName || 'Bride';

        const message = `Assalamualaikum Wr. Wb.

Kepada Yth.
Bapak/Ibu/Saudara/i *${guest.name}*
di tempat

Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:

💍 *${groomName} & ${brideName}* 💍

Untuk informasi detail acara dan konfirmasi kehadiran, silakan kunjungi:
${url}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.

Atas perhatian dan doanya, kami mengucapkan terima kasih.

Wassalamualaikum Wr. Wb.

_Mohon maaf apabila ada kesalahan penulisan nama/gelar._`;

        return message;
    };

    // Open WhatsApp message modal
    const openWhatsappModal = (guest: Guest) => {
        const message = generateWhatsappMessage(guest);
        setWhatsappModal({ guest, message });
        setWhatsappCopied(false);
    };

    // Copy WhatsApp message to clipboard
    const copyWhatsappMessage = async () => {
        if (!whatsappModal) return;
        await navigator.clipboard.writeText(whatsappModal.message);
        setWhatsappCopied(true);
        setTimeout(() => setWhatsappCopied(false), 2000);
    };

    const handleAddGuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGuest.name || !newGuest.slug) return;
        createMutation.mutate();
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    };

    const guests = guestsData || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-secondary-100 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/admin"
                                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-secondary-600" />
                            </Link>
                            <div>
                                <h1 className="font-semibold text-secondary-800">Guest List</h1>
                                <p className="text-xs text-secondary-500">
                                    {weddingData?.groomName} & {weddingData?.brideName}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="btn-secondary flex items-center gap-2 text-sm"
                        >
                            <Upload className="w-4 h-4" />
                            Bulk Import
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Add guest form */}
                <div className="card mb-8">
                    <h2 className="font-medium text-secondary-800 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add New Guest
                    </h2>
                    <form onSubmit={handleAddGuest} className="flex flex-wrap gap-3">
                        <input
                            type="text"
                            value={newGuest.name}
                            onChange={(e) =>
                                setNewGuest({
                                    ...newGuest,
                                    name: e.target.value,
                                    slug: generateSlug(e.target.value),
                                })
                            }
                            className="input flex-1 min-w-[200px]"
                            placeholder="Guest name"
                        />
                        <input
                            type="text"
                            value={newGuest.slug}
                            onChange={(e) =>
                                setNewGuest({
                                    ...newGuest,
                                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                                })
                            }
                            className="input w-40"
                            placeholder="URL slug"
                        />
                        <select
                            value={newGuest.maxAttendees}
                            onChange={(e) =>
                                setNewGuest({ ...newGuest, maxAttendees: parseInt(e.target.value) })
                            }
                            className="input w-24"
                        >
                            {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="btn-primary"
                        >
                            {createMutation.isPending ? 'Adding...' : 'Add Guest'}
                        </button>
                    </form>
                </div>

                {/* Guest list */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium text-secondary-800 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Guests ({guests.length})
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                        </div>
                    ) : guests.length === 0 ? (
                        <div className="text-center py-8 text-secondary-500">
                            No guests added yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-secondary-100">
                            {guests.map((guest, index) => (
                                <motion.div
                                    key={guest.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-secondary-800 truncate">
                                            {guest.name}
                                        </p>
                                        <p className="text-xs text-secondary-500">
                                            /{weddingData?.slug}?to={guest.slug} • Max {guest.maxAttendees} guests
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => openWhatsappModal(guest)}
                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                            title="WhatsApp message"
                                        >
                                            <MessageCircle className="w-4 h-4 text-green-600" />
                                        </button>
                                        <button
                                            onClick={() => copyLink(guest)}
                                            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                                            title="Copy invitation link"
                                        >
                                            {copiedId === guest.id ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-secondary-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(guest.id)}
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                            title="Delete guest"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Bulk import modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg p-6"
                    >
                        <h2 className="font-semibold text-secondary-800 mb-4">
                            Bulk Import Guests
                        </h2>
                        <p className="text-sm text-secondary-500 mb-4">
                            Enter one guest name per line. Slugs will be auto-generated.
                        </p>
                        <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            className="input min-h-[200px] font-mono text-sm"
                            placeholder={`John Doe\nJane Smith\nBob Wilson`}
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => bulkCreateMutation.mutate()}
                                disabled={bulkCreateMutation.isPending || !bulkText.trim()}
                                className="btn-primary"
                            >
                                {bulkCreateMutation.isPending ? 'Importing...' : 'Import'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* WhatsApp message modal */}
            {whatsappModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-secondary-800 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-green-600" />
                                WhatsApp Message
                            </h2>
                            <button
                                onClick={() => setWhatsappModal(null)}
                                className="p-1 hover:bg-secondary-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-secondary-400" />
                            </button>
                        </div>
                        <p className="text-sm text-secondary-500 mb-3">
                            Message for <span className="font-medium text-secondary-700">{whatsappModal.guest.name}</span>
                        </p>
                        <div className="flex-1 overflow-auto">
                            <div className="bg-secondary-50 rounded-xl p-4 text-sm text-secondary-700 whitespace-pre-wrap font-sans leading-relaxed border border-secondary-200">
                                {whatsappModal.message}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-secondary-100">
                            <button
                                onClick={() => setWhatsappModal(null)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                            <button
                                onClick={copyWhatsappMessage}
                                className="btn-primary flex items-center gap-2"
                            >
                                {whatsappCopied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy Message
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

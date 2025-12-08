import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    MessageSquare,
    Check,
    X,
    Trash2,
    User,
    Calendar,
    Users,
} from 'lucide-react';
import { wishesApi, weddingsApi, Wish } from '../../api/client';

export default function WishesPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    // Fetch wedding info
    const { data: weddingData } = useQuery({
        queryKey: ['wedding', id],
        queryFn: async () => {
            const res = await weddingsApi.get(id!);
            return res.data.wedding;
        },
    });

    // Fetch wishes
    const { data: wishesData, isLoading } = useQuery({
        queryKey: ['wishes', id],
        queryFn: async () => {
            const res = await wishesApi.list(id!);
            return res.data.wishes as Wish[];
        },
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: ({ wishId, isApproved }: { wishId: string; isApproved: boolean }) =>
            wishesApi.approve(wishId, isApproved),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishes', id] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (wishId: string) => wishesApi.delete(wishId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishes', id] });
        },
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const wishes = wishesData || [];
    const pendingWishes = wishes.filter((w) => !w.isApproved);
    const approvedWishes = wishes.filter((w) => w.isApproved);

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
                                <h1 className="font-semibold text-secondary-800">Wishes & RSVP</h1>
                                <p className="text-xs text-secondary-500">
                                    {weddingData?.groomName} & {weddingData?.brideName}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="card text-center">
                        <div className="text-2xl font-bold text-secondary-800">{wishes.length}</div>
                        <div className="text-xs text-secondary-500">Total Wishes</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-2xl font-bold text-yellow-600">{pendingWishes.length}</div>
                        <div className="text-xs text-secondary-500">Pending</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {wishes.filter((w) => w.isAttending === true).length}
                        </div>
                        <div className="text-xs text-secondary-500">Attending</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {wishes.filter((w) => w.isAttending === false).length}
                        </div>
                        <div className="text-xs text-secondary-500">Not Attending</div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                    </div>
                ) : wishes.length === 0 ? (
                    <div className="card text-center py-12">
                        <MessageSquare className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                        <p className="text-secondary-500">No wishes received yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Pending wishes */}
                        {pendingWishes.length > 0 && (
                            <div className="mb-8">
                                <h2 className="font-medium text-secondary-800 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                                    Pending Approval ({pendingWishes.length})
                                </h2>
                                <div className="space-y-4">
                                    {pendingWishes.map((wish, index) => (
                                        <WishCard
                                            key={wish.id}
                                            wish={wish}
                                            index={index}
                                            onApprove={(isApproved) =>
                                                approveMutation.mutate({ wishId: wish.id, isApproved })
                                            }
                                            onDelete={() => deleteMutation.mutate(wish.id)}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approved wishes */}
                        {approvedWishes.length > 0 && (
                            <div>
                                <h2 className="font-medium text-secondary-800 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                                    Approved ({approvedWishes.length})
                                </h2>
                                <div className="space-y-4">
                                    {approvedWishes.map((wish, index) => (
                                        <WishCard
                                            key={wish.id}
                                            wish={wish}
                                            index={index}
                                            onApprove={(isApproved) =>
                                                approveMutation.mutate({ wishId: wish.id, isApproved })
                                            }
                                            onDelete={() => deleteMutation.mutate(wish.id)}
                                            formatDate={formatDate}
                                            isApproved
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function WishCard({
    wish,
    index,
    onApprove,
    onDelete,
    formatDate,
    isApproved = false,
}: {
    wish: Wish;
    index: number;
    onApprove: (isApproved: boolean) => void;
    onDelete: () => void;
    formatDate: (date: string) => string;
    isApproved?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-gold-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-medium text-secondary-800">{wish.name}</span>
                        {wish.isAttending !== null && (
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full ${wish.isAttending
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                            >
                                {wish.isAttending ? 'Attending' : 'Not attending'}
                            </span>
                        )}
                        {wish.attendeeCount && wish.attendeeCount > 0 && (
                            <span className="text-xs text-secondary-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {wish.attendeeCount}
                            </span>
                        )}
                    </div>
                    <p className="text-secondary-600 whitespace-pre-line mb-2">{wish.message}</p>
                    <div className="flex items-center gap-2 text-xs text-secondary-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(wish.createdAt)}
                        {wish.guest && (
                            <>
                                <span>•</span>
                                <span>Guest: {wish.guest.name}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {!isApproved ? (
                        <button
                            onClick={() => onApprove(true)}
                            className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                            title="Approve"
                        >
                            <Check className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => onApprove(false)}
                            className="p-2 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors"
                            title="Unapprove"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

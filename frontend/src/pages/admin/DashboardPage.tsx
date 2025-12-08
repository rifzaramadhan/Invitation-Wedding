import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Plus,
    Heart,
    Users,
    MessageSquare,
    Calendar,
    Settings,
    LogOut,
    Eye,
} from 'lucide-react';
import { weddingsApi, Wedding } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const { data: weddingsData, isLoading } = useQuery({
        queryKey: ['weddings'],
        queryFn: async () => {
            const res = await weddingsApi.list();
            return res.data.weddings as Wedding[];
        },
    });

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const weddings = weddingsData || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-secondary-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-gold-500 rounded-xl flex items-center justify-center">
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-secondary-800">Wedding Admin</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-secondary-600 hidden sm:block">
                                {user?.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 text-secondary-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-secondary-800">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-secondary-500 mt-1">
                        Manage your wedding invitations from here
                    </p>
                </div>

                {/* Weddings grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create new card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link
                            to="/admin/wedding/new"
                            className="block h-full min-h-[200px] border-2 border-dashed border-secondary-200 rounded-2xl p-6 hover:border-primary-400 hover:bg-primary-50/50 transition-all group"
                        >
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-secondary-100 group-hover:bg-primary-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                                    <Plus className="w-8 h-8 text-secondary-400 group-hover:text-primary-600 transition-colors" />
                                </div>
                                <h3 className="font-medium text-secondary-700 group-hover:text-primary-700">
                                    Create New Wedding
                                </h3>
                                <p className="text-sm text-secondary-500 mt-1">
                                    Start designing a beautiful invitation
                                </p>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Loading state */}
                    {isLoading &&
                        Array.from({ length: 2 }).map((_, i) => (
                            <div
                                key={i}
                                className="card animate-pulse h-[200px]"
                            >
                                <div className="h-4 bg-secondary-200 rounded w-3/4 mb-4" />
                                <div className="h-3 bg-secondary-100 rounded w-1/2 mb-6" />
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j} className="h-12 bg-secondary-100 rounded" />
                                    ))}
                                </div>
                            </div>
                        ))}

                    {/* Wedding cards */}
                    {weddings.map((wedding, index) => (
                        <WeddingCard key={wedding.id} wedding={wedding} index={index} />
                    ))}
                </div>

                {/* Empty state */}
                {!isLoading && weddings.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-10 h-10 text-secondary-300" />
                        </div>
                        <h3 className="text-lg font-medium text-secondary-700 mb-2">
                            No weddings yet
                        </h3>
                        <p className="text-secondary-500 mb-6">
                            Create your first wedding invitation to get started
                        </p>
                        <Link to="/admin/wedding/new" className="btn-primary inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create Wedding
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}

function WeddingCard({ wedding, index }: { wedding: Wedding; index: number }) {
    const { data: statsData } = useQuery({
        queryKey: ['wedding-stats', wedding.id],
        queryFn: async () => {
            const res = await weddingsApi.stats(wedding.id);
            return res.data.stats;
        },
    });

    const stats = statsData || { totalGuests: 0, totalWishes: 0, attending: 0 };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card relative group"
        >
            {/* Status badge */}
            <div className="absolute top-4 right-4">
                <span
                    className={`text-xs px-2 py-1 rounded-full ${wedding.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-secondary-100 text-secondary-600'
                        }`}
                >
                    {wedding.isActive ? 'Active' : 'Draft'}
                </span>
            </div>

            {/* Wedding info */}
            <div className="mb-4">
                <h3 className="font-serif text-xl text-secondary-800 mb-1">
                    {wedding.groomName} & {wedding.brideName}
                </h3>
                <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-secondary-50 rounded-xl">
                    <Users className="w-4 h-4 text-secondary-400 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-secondary-700">{stats.totalGuests}</div>
                    <div className="text-xs text-secondary-500">Guests</div>
                </div>
                <div className="text-center p-3 bg-secondary-50 rounded-xl">
                    <MessageSquare className="w-4 h-4 text-secondary-400 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-secondary-700">{stats.totalWishes}</div>
                    <div className="text-xs text-secondary-500">Wishes</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                    <Users className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-green-700">{stats.attending}</div>
                    <div className="text-xs text-green-600">Attending</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-secondary-100">
                <Link
                    to={`/admin/wedding/${wedding.id}`}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                >
                    <Settings className="w-4 h-4" />
                    Edit
                </Link>
                <Link
                    to={`/admin/wedding/${wedding.id}/guests`}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                >
                    <Users className="w-4 h-4" />
                    Guests
                </Link>
                <a
                    href={`/${wedding.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                    title="Preview"
                >
                    <Eye className="w-5 h-5 text-secondary-400" />
                </a>
            </div>
        </motion.div>
    );
}

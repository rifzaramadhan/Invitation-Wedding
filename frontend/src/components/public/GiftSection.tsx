import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, CreditCard, Wallet } from 'lucide-react';

interface GiftSectionProps {
    giftSettings: {
        bankAccounts: Array<{
            bankName: string;
            accountNumber: string;
            accountName: string;
        }>;
        eWallets?: Array<{
            name: string;
            number: string;
            accountName: string;
        }>;
    };
}

export default function GiftSection({ giftSettings }: GiftSectionProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <section
            className="py-20 px-6"
            style={{ background: `linear-gradient(to bottom, var(--theme-secondary-light), var(--theme-background))` }}
        >
            <div className="max-w-3xl mx-auto">
                {/* Section title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-block mb-4">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                            style={{ background: `linear-gradient(to bottom right, var(--theme-accent-light), var(--theme-primary-light))` }}
                        >
                            <Gift className="w-10 h-10" style={{ color: 'var(--theme-accent)' }} />
                        </div>
                    </div>
                    <p
                        className="text-sm uppercase tracking-[0.3em] mb-2"
                        style={{ color: 'var(--theme-primary)' }}
                    >
                        Digital Envelope
                    </p>
                    <h2 className="text-3xl md:text-4xl theme-font-heading theme-text">Wedding Gift</h2>
                    <p className="theme-text-light mt-4 max-w-md mx-auto">
                        Your presence at our wedding is the greatest gift of all. However, if you wish to honor us with a gift, we have provided the following options.
                    </p>
                </motion.div>

                <div className="space-y-6">
                    {/* Bank accounts */}
                    {giftSettings.bankAccounts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="flex items-center gap-2 theme-text font-medium mb-4">
                                <CreditCard className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                                Bank Transfer
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {giftSettings.bankAccounts.map((account, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="theme-card rounded-2xl p-6 shadow-lg"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ background: `linear-gradient(to bottom right, var(--theme-primary-light), var(--theme-secondary-light))` }}
                                            >
                                                <span
                                                    className="text-lg font-bold"
                                                    style={{ color: 'var(--theme-primary)' }}
                                                >
                                                    {account.bankName.substring(0, 3).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium theme-text">{account.bankName}</p>
                                                <p className="text-sm theme-text-light">a.n. {account.accountName}</p>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-2 rounded-xl p-3"
                                            style={{ backgroundColor: 'var(--theme-secondary-light)' }}
                                        >
                                            <span className="flex-1 font-mono text-lg theme-text">
                                                {account.accountNumber}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(account.accountNumber, `bank-${index}`)}
                                                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                                            >
                                                {copiedId === `bank-${index}` ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-5 h-5 theme-text-light" />
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* E-wallets */}
                    {giftSettings.eWallets && giftSettings.eWallets.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="flex items-center gap-2 theme-text font-medium mb-4">
                                <Wallet className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                                E-Wallet
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {giftSettings.eWallets.map((wallet, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="theme-card rounded-2xl p-6 shadow-lg"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ background: `linear-gradient(to bottom right, var(--theme-accent-light), var(--theme-primary-light))` }}
                                            >
                                                <Wallet className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
                                            </div>
                                            <div>
                                                <p className="font-medium theme-text">{wallet.name}</p>
                                                <p className="text-sm theme-text-light">a.n. {wallet.accountName}</p>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-2 rounded-xl p-3"
                                            style={{ backgroundColor: 'var(--theme-secondary-light)' }}
                                        >
                                            <span className="flex-1 font-mono text-lg theme-text">
                                                {wallet.number}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(wallet.number, `wallet-${index}`)}
                                                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                                            >
                                                {copiedId === `wallet-${index}` ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-5 h-5 theme-text-light" />
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}


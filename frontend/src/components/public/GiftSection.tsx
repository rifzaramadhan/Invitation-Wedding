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
        <section className="py-20 px-6 bg-gradient-to-b from-secondary-50 to-white">
            <div className="max-w-3xl mx-auto">
                {/* Section title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-block mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-gold-100 to-gold-200 rounded-full flex items-center justify-center mx-auto">
                            <Gift className="w-10 h-10 text-gold-600" />
                        </div>
                    </div>
                    <p className="text-primary-600 text-sm uppercase tracking-[0.3em] mb-2">
                        Digital Envelope
                    </p>
                    <h2 className="section-title">Wedding Gift</h2>
                    <p className="text-secondary-600 mt-4 max-w-md mx-auto">
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
                            <h3 className="flex items-center gap-2 text-secondary-700 font-medium mb-4">
                                <CreditCard className="w-5 h-5 text-gold-500" />
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
                                        className="card"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
                                                <span className="text-lg font-bold text-primary-600">
                                                    {account.bankName.substring(0, 3).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-secondary-800">{account.bankName}</p>
                                                <p className="text-sm text-secondary-500">a.n. {account.accountName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-secondary-50 rounded-xl p-3">
                                            <span className="flex-1 font-mono text-lg text-secondary-700">
                                                {account.accountNumber}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(account.accountNumber, `bank-${index}`)}
                                                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                                            >
                                                {copiedId === `bank-${index}` ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-secondary-400" />
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
                            <h3 className="flex items-center gap-2 text-secondary-700 font-medium mb-4">
                                <Wallet className="w-5 h-5 text-gold-500" />
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
                                        className="card"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-gold-100 to-gold-200 rounded-xl flex items-center justify-center">
                                                <Wallet className="w-6 h-6 text-gold-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-secondary-800">{wallet.name}</p>
                                                <p className="text-sm text-secondary-500">a.n. {wallet.accountName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-secondary-50 rounded-xl p-3">
                                            <span className="flex-1 font-mono text-lg text-secondary-700">
                                                {wallet.number}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(wallet.number, `wallet-${index}`)}
                                                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                                            >
                                                {copiedId === `wallet-${index}` ? (
                                                    <Check className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-secondary-400" />
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

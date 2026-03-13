"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Wallet, ChevronRight, Copy, 
  CheckCircle, QrCode, Upload, Info, 
  AlertCircle, ShieldCheck, Send
} from 'lucide-react';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type DepositStep = 'selection' | 'address' | 'evidence';

interface CryptoOption {
  id: string;
  name: string;
  symbol: string;
  address: string;
  qrCode: string;
  network: string;
}

const CRYPTO_OPTIONS: CryptoOption[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    address: 'bc1qer5t8hlnwg27slx2jr9qhw3qnqjjfaux9gcsmm',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bc1qer5t8hlnwg27slx2jr9qhw3qnqjjfaux9gcsmm',
    network: 'Bitcoin'
  },
  {
    id: 'usdt',
    name: 'USDT (Tron)',
    symbol: 'USDT',
    address: 'TFX2ktfJCDvdgLxt4di2AArfUKTnTQQ7yP',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TFX2ktfJCDvdgLxt4di2AArfUKTnTQQ7yP',
    network: 'TRC-20'
  }
];

export default function DepositPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<DepositStep>('selection');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'receipts');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        setReceiptUrl(data.url);
        toast.success("Receipt uploaded successfully");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!receiptUrl) {
      toast.error("Please upload your payment receipt");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await api.post('/deposits', {
        amount: Number(amount),
        currency: selectedCrypto?.symbol,
        address: selectedCrypto?.address,
        receipt_url: receiptUrl,
        tx_hash: txHash,
      });

      if (error) throw error;

      toast.success("Deposit submitted for approval");
      navigate(createPageUrl('Wallet'));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => step === 'selection' ? navigate(createPageUrl('Wallet')) : setStep(step === 'evidence' ? 'address' : 'selection')}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Deposit Funds</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          {step === 'selection' && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Secure Deposits</h3>
                    <p className="text-xs text-muted-foreground mt-1">Select your preferred cryptocurrency to generate a unique deposit address. Your funds will be credited after admin verification.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Select Asset</p>
                {CRYPTO_OPTIONS.map((crypto) => (
                  <button
                    key={crypto.id}
                    onClick={() => {
                        setSelectedCrypto(crypto);
                        setStep('address');
                    }}
                    className="w-full flex items-center justify-between p-5 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center font-bold text-lg group-hover:text-primary transition-all">
                        {crypto.symbol.slice(0, 1)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{crypto.name}</p>
                        <p className="text-xs text-muted-foreground">{crypto.network} Network</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'address' && selectedCrypto && (
            <motion.div 
              key="address"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white rounded-3xl shadow-xl shadow-primary/5 border border-border mb-6">
                  <img src={selectedCrypto.qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold">{selectedCrypto.name} Address</h3>
                  <p className="text-xs text-muted-foreground mt-1">Only send {selectedCrypto.symbol} to this address</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 border border-border rounded-2xl flex items-center justify-between gap-4">
                  <p className="text-xs font-mono break-all line-clamp-2">{selectedCrypto.address}</p>
                  <button 
                    onClick={() => handleCopy(selectedCrypto.address)}
                    className="p-2 rounded-xl bg-background hover:bg-muted transition-all shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Amount to send ($)</label>
                    <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full h-14 px-6 bg-card border border-border rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <button 
                    onClick={() => {
                        if (amount && Number(amount) > 0) {
                            setStep('evidence');
                        } else {
                            toast.error("Please enter a valid amount first");
                        }
                    }}
                    className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Paid / Payment Complete
                </button>
              </div>
            </motion.div>
          )}

          {step === 'evidence' && selectedCrypto && (
            <motion.div 
              key="evidence"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="h-16 w-16 bg-success/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-bold">Proof of Payment</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-[280px] mx-auto">Please upload a screenshot of your transaction receipt to finalize your deposit.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Transaction Receipt</label>
                    <div className="relative group">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden" 
                            id="receipt-upload" 
                            disabled={isUploading}
                        />
                        <label 
                            htmlFor="receipt-upload"
                            className={cn(
                                "flex flex-col items-center justify-center w-full aspect-video rounded-3xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-all overflow-hidden",
                                receiptUrl ? "bg-card border-solid border-success/50" : "bg-muted/30"
                            )}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Uploading...</p>
                                </div>
                            ) : receiptUrl ? (
                                <img src={receiptUrl} alt="Receipt preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-all">
                                    <Upload className="h-8 w-8" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Tap to Upload Receipt</p>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Transaction Hash (Optional)</label>
                    <input 
                        type="text"
                        placeholder="Paste your TXID here..."
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        className="w-full h-14 px-6 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                    />
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={submitting || isUploading || !receiptUrl}
                  className="w-full h-16 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Send className="h-5 w-5" />}
                  Submit Deposit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

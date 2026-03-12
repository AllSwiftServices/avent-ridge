"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, Clock, ChevronLeft, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const INPUT_CLASS = "w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors";
const LABEL_CLASS = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

function UploadBox({ label, value, onChange, hint }: { label: string, value: string, onChange: (v: string) => void, hint?: string }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFile = async (file: File) => {
    if (!file || !user) return;
    toast.loading('Uploading...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Uploaded!');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      toast.dismiss();
    }
  };

  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !value && inputRef.current?.click()}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
          drag ? "border-primary bg-primary/5" : value ? "border-primary bg-card" : "border-border bg-card"
        )}
        style={{ minHeight: 110 }}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleFile(e.target.files[0])} />
        {value ? (
          <div className="relative">
            <img src={value} alt="preview" className="w-full h-36 object-cover rounded-xl" />
            <button
              onClick={e => { e.stopPropagation(); onChange(''); }}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-1"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Upload className={cn("h-7 w-7", drag ? "text-primary" : "text-muted-foreground")} />
            <p className="text-xs text-muted-foreground">Drag & drop or <span className="text-primary">browse</span></p>
            {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyIdentity() {
  const { user, isLoadingAuth } = useAuth();
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', phone: '',
    address: '', city: '', state: '', country: '', postal_code: '',
    id_type: 'passport', id_number: '',
    id_front_image: '', id_back_image: '', selfie_image: '',
  });

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      router.push('/login');
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('kyc')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) setExisting(data);
      } catch (error) {
        console.error('Error fetching KYC status:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isLoadingAuth, router]);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.id_number || !form.id_front_image || !form.selfie_image) {
      toast.error('Please fill in all required fields and upload images.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('kyc').insert({
        ...form,
        user_id: user.id,
        user_email: user.email,
        status: 'pending',
      });

      if (error) throw error;

      const { data } = await supabase
        .from('kyc')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setExisting(data);
      toast.success('Submitted successfully!');
    } catch (error: any) {
      toast.error('Submission failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isLoadingAuth) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background">
      <header className="sticky top-0 z-30 border-b flex items-center gap-3 px-4 py-4 bg-background/95 border-border">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-bold text-foreground text-lg">Identity Verification</h1>
          <p className="text-xs text-muted-foreground">Verify your identity to unlock full access</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Status Banner */}
        {existing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl p-4 flex items-center gap-3 border transition-colors",
              existing.status === 'approved' ? "bg-primary/10 border-primary" : 
              existing.status === 'rejected' ? "bg-destructive/10 border-destructive" : 
              "bg-muted border-border"
            )}
          >
            {existing.status === 'approved' && <CheckCircle className="h-6 w-6 shrink-0 text-primary" />}
            {existing.status === 'pending' && <Clock className="h-6 w-6 shrink-0 text-primary" />}
            {existing.status === 'rejected' && <X className="h-6 w-6 shrink-0 text-destructive" />}
            <div>
              <p className="font-bold text-foreground text-sm">
                {existing.status === 'approved' ? '✔ Verified' : existing.status === 'pending' ? '⏳ Verification Pending' : '✖ Verification Failed'}
              </p>
              {existing.rejection_reason && <p className="text-xs text-destructive mt-0.5">{existing.rejection_reason}</p>}
              {existing.status === 'pending' && <p className="text-xs text-muted-foreground mt-0.5">Our team typically reviews within 1–2 business days.</p>}
            </div>
          </motion.div>
        )}

        {!existing && (
          <>
            {/* Section A */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5 border space-y-4 bg-card border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Personal Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={LABEL_CLASS}>First Name *</label><input className={INPUT_CLASS} placeholder="John" value={form.first_name} onChange={set('first_name')} /></div>
                <div><label className={LABEL_CLASS}>Last Name *</label><input className={INPUT_CLASS} placeholder="Doe" value={form.last_name} onChange={set('last_name')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={LABEL_CLASS}>Date of Birth</label><input type="date" className={INPUT_CLASS} value={form.date_of_birth} onChange={set('date_of_birth')} /></div>
                <div><label className={LABEL_CLASS}>Phone Number</label><input className={INPUT_CLASS} placeholder="+1 234 567 890" value={form.phone} onChange={set('phone')} /></div>
              </div>
              <div><label className={LABEL_CLASS}>Residential Address</label><input className={INPUT_CLASS} placeholder="123 Main Street" value={form.address} onChange={set('address')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={LABEL_CLASS}>City</label><input className={INPUT_CLASS} placeholder="New York" value={form.city} onChange={set('city')} /></div>
                <div><label className={LABEL_CLASS}>State</label><input className={INPUT_CLASS} placeholder="NY" value={form.state} onChange={set('state')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={LABEL_CLASS}>Country</label><input className={INPUT_CLASS} placeholder="United States" value={form.country} onChange={set('country')} /></div>
                <div><label className={LABEL_CLASS}>Postal Code</label><input className={INPUT_CLASS} placeholder="10001" value={form.postal_code} onChange={set('postal_code')} /></div>
              </div>
            </motion.div>

            {/* Section B */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl p-5 border space-y-4 bg-card border-border shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Identity Document</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>ID Type *</label>
                  <select className={INPUT_CLASS} value={form.id_type} onChange={set('id_type')}>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID</option>
                  </select>
                </div>
                <div><label className={LABEL_CLASS}>ID Number *</label><input className={INPUT_CLASS} placeholder="AB1234567" value={form.id_number} onChange={set('id_number')} /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UploadBox label="Front of ID *" value={form.id_front_image} onChange={v => setForm(f => ({ ...f, id_front_image: v }))} hint="Clear photo of front" />
                <UploadBox label="Back of ID" value={form.id_back_image} onChange={v => setForm(f => ({ ...f, id_back_image: v }))} hint="Clear photo of back" />
              </div>
              <UploadBox label="Selfie *" value={form.selfie_image} onChange={v => setForm(f => ({ ...f, selfie_image: v }))} hint="Hold your ID next to your face" />
            </motion.div>

            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base border-2 transition-all shadow-lg shadow-primary/20",
                submitting ? "bg-muted border-muted-foreground text-muted-foreground" : "bg-primary text-primary-foreground border-primary hover:opacity-90"
              )}
            >
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
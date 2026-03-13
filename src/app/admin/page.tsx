"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckCircle, XCircle, Clock, Search, 
  ExternalLink, Eye, AlertCircle, FileText, 
  Shield, ArrowLeft, LayoutDashboard, Wallet, 
  TrendingUp, Settings, ChevronRight, Save,
  RefreshCcw, Filter, ArrowUpRight, ArrowDownRight,
  UserPlus, Mail, Phone, Calendar, MapPin
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from '@/lib/react-router-shim';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

type AdminTab = 'overview' | 'users' | 'deposits' | 'kyc' | 'assets';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  kyc_status: string;
  created_at: string;
}

interface Deposit {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  currency: string;
  address: string;
  receipt_url: string;
  tx_hash: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

interface KYCSubmission {
  id: string;
  user_id: string;
  user_email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  id_type: string;
  id_number: string;
  id_front_image: string;
  id_back_image: string;
  selfie_image: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  price: number;
  change_percent: number;
  updated_at: string;
}

export default function AdminDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data states
  const [users, setUsers] = useState<UserData[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Selection states
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!user || user.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      fetchAllData();
    }
  }, [user, isLoadingAuth, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, kRes, aRes] = await Promise.all([
        api.get<UserData[]>('/users'),
        api.get<Deposit[]>('/deposits'),
        api.get<KYCSubmission[]>('/kyc'),
        api.get<Asset[]>('/assets')
      ]);

      setUsers(uRes.data || []);
      setDeposits(dRes.data || []);
      setKycSubmissions(kRes.data || []);
      setAssets(aRes.data || []);
    } catch (err: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeposit = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !rejectReason) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setProcessing(true);
    try {
      const { error } = await api.patch(`/deposits/${id}`, { status, rejection_reason: rejectReason });
      if (error) throw error;
      toast.success(`Deposit ${status}`);
      setSelectedDeposit(null);
      setRejectReason("");
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateKYC = async (id: string, status: 'approved' | 'rejected') => {
      if (status === 'rejected' && !rejectReason) {
          toast.error("Please provide a rejection reason");
          return;
      }
      setProcessing(true);
      try {
          const { error } = await api.patch(`/kyc/${id}`, { status, rejection_reason: rejectReason });
          if (error) throw error;
          toast.success(`KYC ${status}`);
          setSelectedKYC(null);
          setRejectReason("");
          fetchAllData();
      } catch (err: any) {
          toast.error(err.message);
      } finally {
          setProcessing(false);
      }
  };

  const handleUpdateUser = async (id: string, updates: Partial<UserData>) => {
      setProcessing(true);
      try {
          const { error } = await api.patch(`/users/${id}`, updates);
          if (error) throw error;
          toast.success("User updated");
          setSelectedUser(null);
          fetchAllData();
      } catch (err: any) {
          toast.error(err.message);
      } finally {
          setProcessing(false);
      }
  };

  const handleUpdateAsset = async () => {
      if (!editingAsset) return;
      setProcessing(true);
      try {
          const { error } = await api.patch(`/assets/${editingAsset.id}`, {
              price: editingAsset.price,
              change_percent: editingAsset.change_percent
          });
          if (error) throw error;
          toast.success("Asset updated");
          setEditingAsset(null);
          fetchAllData();
      } catch (err: any) {
          toast.error(err.message);
      } finally {
          setProcessing(false);
      }
  };

  if (isLoadingAuth || (user && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Shield className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Admin Console</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">Manage users, funding, and platform assets</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search everything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl md:rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button 
                onClick={fetchAllData}
                disabled={loading}
                className="p-2.5 rounded-xl md:rounded-2xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
          </div>
        </div>
      </header>

      {/* ── NAVIGATION TABS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-2xl w-full md:w-fit overflow-x-auto scrollbar-hide">
          {(['overview', 'users', 'deposits', 'kyc', 'assets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap flex-1 md:flex-initial text-center",
                activeTab === tab 
                  ? "bg-background shadow text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
          <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                    key="overview"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <StatCard icon={Users} label="Total Users" value={users.length} color="primary" />
                    <StatCard icon={Clock} label="Pending KYC" value={kycSubmissions.filter(s => s.status === 'pending').length} color="amber" />
                    <StatCard icon={Wallet} label="Pending Deposits" value={deposits.filter(d => d.status === 'pending').length} color="success" />
                    <StatCard icon={TrendingUp} label="Total Assets" value={assets.length} color="blue" />
                    
                    {/* Activity Feed placeholders */}
                    <div className="md:col-span-2 lg:col-span-3 bg-card border border-border rounded-3xl p-4 md:p-6">
                        <h3 className="font-bold mb-3 md:mb-4">Recent Deposits</h3>
                        <div className="space-y-4">
                            {deposits.slice(0, 5).map(d => (
                                <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                                            <ArrowUpRight className="h-4 w-4 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">${d.amount} {d.currency}</p>
                                            <p className="text-[10px] text-muted-foreground">{d.user_email}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                                        d.status === 'approved' ? 'bg-success/10 text-success' : 
                                        d.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
                                    )}>{d.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                  <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      {/* Mobile Card View */}
                      <div className="grid grid-cols-1 gap-4 md:hidden">
                          {users.filter(u => u.email.includes(searchQuery) || u.name?.includes(searchQuery)).map(u => (
                              <div key={u.id} onClick={() => setSelectedUser(u)} className="bg-card border border-border p-4 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all">
                                  <div className="flex flex-col gap-1">
                                      <span className="text-sm font-bold">{u.name || 'Anonymous'}</span>
                                      <span className="text-[10px] text-muted-foreground font-mono">{u.email}</span>
                                      <div className="flex gap-2 mt-1">
                                          <span className={cn(
                                              "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                                              u.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                                          )}>{u.role}</span>
                                          <span className={cn(
                                              "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                                              u.kyc_status === 'approved' ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-500'
                                          )}>{u.kyc_status}</span>
                                      </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                          ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-muted/30 border-b border-border">
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User</th>
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">KYC Status</th>
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Joined</th>
                                      <th className="px-6 py-4 text-right"></th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                  {users.filter(u => u.email.includes(searchQuery) || u.name?.includes(searchQuery)).map(u => (
                                      <tr key={u.id} className="hover:bg-muted/10 transition-colors group">
                                          <td className="px-6 py-4">
                                              <div className="flex flex-col">
                                                  <span className="text-sm font-bold">{u.name || 'Anonymous'}</span>
                                                  <span className="text-[10px] text-muted-foreground font-mono">{u.email}</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4">
                                              <span className={cn(
                                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                  u.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                                              )}>{u.role}</span>
                                          </td>
                                          <td className="px-6 py-4">
                                               <span className={cn(
                                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                  u.kyc_status === 'approved' ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-500'
                                              )}>{u.kyc_status}</span>
                                          </td>
                                          <td className="px-6 py-4 text-xs text-muted-foreground">
                                              {format(new Date(u.created_at), 'MMM dd, yyyy')}
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <button 
                                                onClick={() => setSelectedUser(u)}
                                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                                              >
                                                  <Eye className="h-4 w-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </motion.div>
              )}

               {activeTab === 'deposits' && (
                    <motion.div key="deposits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                         {/* Mobile Card View */}
                         <div className="grid grid-cols-1 gap-4 md:hidden">
                             {deposits.map(d => (
                                 <div key={d.id} onClick={() => setSelectedDeposit(d)} className="bg-card border border-border p-4 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all">
                                     <div className="flex flex-col gap-1">
                                         <div className="flex items-center gap-2">
                                             <span className="text-sm font-bold">${d.amount} {d.currency}</span>
                                             <span className={cn(
                                                 "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                                                 d.status === 'approved' ? 'bg-success/10 text-success' : 
                                                 d.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
                                             )}>{d.status}</span>
                                         </div>
                                         <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{d.user_email}</span>
                                         <span className="text-[9px] text-muted-foreground">{format(new Date(d.created_at), 'MMM dd, HH:mm')}</span>
                                     </div>
                                     <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                 </div>
                             ))}
                         </div>

                         {/* Desktop Table View */}
                         <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden">
                             <table className="w-full text-left">
                                 <thead>
                                     <tr className="bg-muted/30 border-b border-border">
                                         <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User</th>
                                         <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                                         <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Currency</th>
                                         <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                         <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                                         <th className="px-6 py-4 text-right"></th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-border">
                                     {deposits.map(d => (
                                         <tr key={d.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedDeposit(d)}>
                                             <td className="px-6 py-4 text-[10px] font-mono">{d.user_email}</td>
                                             <td className="px-6 py-4 text-sm font-bold">${d.amount}</td>
                                             <td className="px-6 py-4 text-xs">{d.currency}</td>
                                             <td className="px-6 py-4">
                                                 <span className={cn(
                                                     "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                                     d.status === 'approved' ? 'bg-success/10 text-success' : 
                                                     d.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
                                                 )}>{d.status}</span>
                                             </td>
                                             <td className="px-6 py-4 text-[10px] text-muted-foreground">
                                                 {format(new Date(d.created_at), 'MMM dd, HH:mm')}
                                             </td>
                                             <td className="px-6 py-4 text-right">
                                                 <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                                     <ChevronRight className="h-4 w-4" />
                                                 </button>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                    </motion.div>
               )}

               {activeTab === 'kyc' && (
                  <motion.div key="kyc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      {/* Mobile Card View */}
                      <div className="grid grid-cols-1 gap-4 md:hidden">
                          {kycSubmissions.map(s => (
                              <div key={s.id} onClick={() => setSelectedKYC(s)} className="bg-card border border-border p-4 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all">
                                  <div className="flex flex-col gap-1">
                                      <span className="text-sm font-bold">{s.first_name} {s.last_name}</span>
                                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{s.user_email}</span>
                                      <div className="flex gap-2 mt-1">
                                          <span className="text-[9px] font-bold uppercase text-muted-foreground">{s.id_type.replace(/_/g, ' ')}</span>
                                          <span className={cn(
                                              "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                                              s.status === 'approved' ? 'bg-success/10 text-success' : 
                                              s.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
                                          )}>{s.status}</span>
                                      </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                          ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block bg-card border border-border rounded-3xl overflow-hidden">
                          <table className="w-full text-left">
                              <thead>
                                  <tr className="bg-muted/30 border-b border-border">
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">User</th>
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID Type</th>
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submitted</th>
                                      <th className="px-6 py-4 text-right"></th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                  {kycSubmissions.map(s => (
                                      <tr key={s.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedKYC(s)}>
                                          <td className="px-6 py-4">
                                              <div className="flex flex-col">
                                                  <span className="text-sm font-bold">{s.first_name} {s.last_name}</span>
                                                  <span className="text-[10px] text-muted-foreground font-mono">{s.user_email}</span>
                                              </div>
                                          </td>
                                          <td className="px-6 py-4 text-xs capitalize">{s.id_type.replace(/_/g, ' ')}</td>
                                          <td className="px-6 py-4">
                                               <span className={cn(
                                                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                                                  s.status === 'approved' ? 'bg-success/10 text-success' : 
                                                  s.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
                                              )}>{s.status}</span>
                                          </td>
                                          <td className="px-6 py-4 text-xs text-muted-foreground">
                                              {format(new Date(s.created_at), 'MMM dd, yyyy')}
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                                  <Eye className="h-4 w-4" />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </motion.div>
              )}

              {activeTab === 'assets' && (
                  <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {assets.map(asset => (
                              <div key={asset.id} className="bg-card border border-border p-6 rounded-3xl group hover:border-primary/30 transition-all">
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center font-bold text-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                          {asset.symbol.slice(0, 1)}
                                      </div>
                                      <button 
                                        onClick={() => setEditingAsset(asset)}
                                        className="p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl bg-muted hover:bg-muted/80"
                                      >
                                          <Settings className="h-4 w-4" />
                                      </button>
                                  </div>
                                  <h3 className="font-bold text-lg">{asset.name}</h3>
                                  <p className="text-xs text-muted-foreground mb-4">{asset.symbol} • {asset.type}</p>
                                  
                                  <div className="flex items-end justify-between">
                                      <div>
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Price</p>
                                          <p className="text-2xl font-bold tracking-tight">${asset.price.toLocaleString()}</p>
                                      </div>
                                      <div className={cn(
                                          "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg",
                                          asset.change_percent >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                      )}>
                                          {asset.change_percent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                          {Math.abs(asset.change_percent)}%
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      </main>

      {/* ── MODALS (USER DETAIL, DEPOSIT DETAIL, KYC DETAIL, ASSET EDIT) ── */}
      <AnimatePresence>
          {editingAsset && (
              <DetailModal title={`Update ${editingAsset.symbol}`} onClose={() => setEditingAsset(null)}>
                  <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Price (USD)</label>
                                <input 
                                    type="number"
                                    value={editingAsset.price}
                                    onChange={(e) => setEditingAsset({...editingAsset, price: Number(e.target.value)})}
                                    className="w-full h-11 px-4 bg-muted border border-border rounded-xl text-sm focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">24h Change (%)</label>
                                <input 
                                    type="number"
                                    value={editingAsset.change_percent}
                                    onChange={(e) => setEditingAsset({...editingAsset, change_percent: Number(e.target.value)})}
                                    className="w-full h-11 px-4 bg-muted border border-border rounded-xl text-sm focus:outline-none"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleUpdateAsset}
                            disabled={processing}
                            className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {processing ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Changes
                        </button>
                  </div>
              </DetailModal>
          )}

          {selectedKYC && (
              <DetailModal title="Review Identity" onClose={() => setSelectedKYC(null)}>
                  <div className="space-y-8">
                     <div className="grid grid-cols-2 gap-6">
                        <InfoItem label="First Name" value={selectedKYC.first_name} />
                        <InfoItem label="Last Name" value={selectedKYC.last_name} />
                        <InfoItem label="Date of Birth" value={selectedKYC.date_of_birth} />
                        <InfoItem label="Phone" value={selectedKYC.phone} />
                        <div className="col-span-2">
                          <InfoItem label="Address" value={`${selectedKYC.address}, ${selectedKYC.city}, ${selectedKYC.state}, ${selectedKYC.country}`} />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <DocumentImage label="ID Front" url={selectedKYC.id_front_image} />
                         <DocumentImage label="ID Back" url={selectedKYC.id_back_image} />
                         <DocumentImage label="Liveness Selfie" url={selectedKYC.selfie_image} />
                     </div>

                     {selectedKYC.status === 'pending' ? (
                          <div className="space-y-4 pt-6 border-t border-border">
                              <textarea 
                                placeholder="Rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full p-4 bg-muted/50 border border-border rounded-2xl text-sm min-h-[80px]"
                              />
                              <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => handleUpdateKYC(selectedKYC.id, 'approved')} disabled={processing} className="h-12 bg-primary text-primary-foreground font-bold rounded-2xl">Approve</button>
                                  <button onClick={() => handleUpdateKYC(selectedKYC.id, 'rejected')} disabled={processing} className="h-12 bg-destructive text-destructive-foreground font-bold rounded-2xl">Reject</button>
                              </div>
                          </div>
                      ) : (
                          <div className={cn("p-4 rounded-2xl text-center font-bold", selectedKYC.status === 'approved' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                              KYC {selectedKYC.status.toUpperCase()}
                          </div>
                      )}
                  </div>
              </DetailModal>
          )}
          {selectedUser && (
              <DetailModal title="User Management" onClose={() => setSelectedUser(null)}>
                  <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/30 border border-border">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                              <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                              <h3 className="font-bold">{selectedUser.name || 'Anonymous'}</h3>
                              <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Role</label>
                              <select 
                                value={selectedUser.role}
                                onChange={(e) => handleUpdateUser(selectedUser.id, { role: e.target.value })}
                                className="w-full h-11 px-4 bg-muted border border-border rounded-xl text-sm focus:outline-none"
                              >
                                  <option value="buyer">Buyer</option>
                                  <option value="admin">Admin</option>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Status</label>
                              <select 
                                value={selectedUser.status}
                                onChange={(e) => handleUpdateUser(selectedUser.id, { status: e.target.value })}
                                className="w-full h-11 px-4 bg-muted border border-border rounded-xl text-sm focus:outline-none"
                              >
                                  <option value="active">Active</option>
                                  <option value="suspended">Suspended</option>
                              </select>
                          </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                          <p className="text-xs font-bold text-amber-500 flex items-center gap-2 mb-1">
                              <AlertCircle className="h-4 w-4" /> Warning
                          </p>
                          <p className="text-[10px] text-muted-foreground">Changing user roles or suspending accounts takes immediate effect. Users may be logged out or restricted from trading tasks.</p>
                      </div>
                  </div>
              </DetailModal>
          )}

          {selectedDeposit && (
              <DetailModal title="Review Deposit" onClose={() => setSelectedDeposit(null)}>
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                          <InfoItem label="Amount" value={`$${selectedDeposit.amount}`} />
                          <InfoItem label="Currency" value={selectedDeposit.currency} />
                          <div className="col-span-2">
                            <InfoItem label="TX Hash" value={selectedDeposit.tx_hash || 'N/A'} />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Transaction Receipt</label>
                          <div className="aspect-video rounded-2xl bg-muted border border-border overflow-hidden relative">
                              {selectedDeposit.receipt_url ? (
                                  <>
                                    <img src={selectedDeposit.receipt_url} alt="Receipt" className="w-full h-full object-contain" />
                                    <a href={selectedDeposit.receipt_url} target="_blank" className="absolute top-2 right-2 p-2 bg-background/50 backdrop-blur-sm rounded-lg hover:bg-background/80 transition-all">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </>
                              ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                      <FileText className="h-8 w-8 opacity-20" />
                                      <p className="text-xs">No receipt uploaded</p>
                                  </div>
                              )}
                          </div>
                      </div>

                      {selectedDeposit.status === 'pending' ? (
                          <div className="space-y-4">
                              <textarea 
                                placeholder="Rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full p-4 bg-muted/50 border border-border rounded-2xl text-sm min-h-[80px]"
                              />
                              <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => handleUpdateDeposit(selectedDeposit.id, 'approved')} disabled={processing} className="h-12 bg-primary text-primary-foreground font-bold rounded-2xl">Approve</button>
                                  <button onClick={() => handleUpdateDeposit(selectedDeposit.id, 'rejected')} disabled={processing} className="h-12 bg-destructive text-destructive-foreground font-bold rounded-2xl">Reject</button>
                              </div>
                          </div>
                      ) : (
                          <div className={cn("p-4 rounded-2xl text-center font-bold", selectedDeposit.status === 'approved' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                              DEPOSIT {selectedDeposit.status.toUpperCase()}
                          </div>
                      )}
                  </div>
              </DetailModal>
          )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
    const colors = {
        primary: "bg-primary/10 text-primary",
        amber: "bg-amber-500/10 text-amber-500",
        success: "bg-success/10 text-success",
        blue: "bg-blue-500/10 text-blue-500"
    };
    return (
        <div className="bg-card border border-border p-4 md:p-6 rounded-3xl">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3 md:mb-4 transition-transform group-hover:scale-110", colors[color as keyof typeof colors])}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] text-muted-foreground tracking-wide uppercase font-bold mb-1">{label}</p>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{value}</h3>
        </div>
    );
}

function DetailModal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative w-full max-w-2xl bg-card border-x border-t md:border border-border shadow-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col max-h-[92vh]">
                <div className="px-6 py-4 md:px-8 md:py-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg md:text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><XCircle className="h-6 w-6 text-muted-foreground" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
            </motion.div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string, value: string }) {
    return (
      <div className="bg-muted/30 px-4 py-3 rounded-2xl border border-border/50">
        <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide font-bold">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    );
}

function DocumentImage({ label, url }: { label: string, url: string }) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">{label}</span>
          {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary font-bold flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-2.5 w-2.5" /> VIEW FULL SIZE
              </a>
          )}
        </div>
        <div className="aspect-4/3 rounded-2xl bg-muted border border-border overflow-hidden group relative flex items-center justify-center">
          {url ? (
            <img src={url} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
              <Shield className="h-10 w-10" />
              <span className="text-[10px] font-bold">MISSING</span>
            </div>
          )}
        </div>
      </div>
    );
}

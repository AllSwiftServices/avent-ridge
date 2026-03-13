"use client";

import { Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/navigation/Sidebar';
import BottomNav from '@/components/navigation/BottomNav';
import QuickTradeButton from '@/components/common/QuickTradeButton';
import { PwaInstallPrompt } from '@/components/common/PwaInstallPrompt';
import { NotificationPrompt } from '@/components/common/NotificationPrompt';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';

const authPages = ['/'];
const noNavPages = ['/verify-identity', '/admin-kyc'];

export default function AppContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoadingAuth } = useAuth();

    const isAuthPage = authPages.includes(pathname);
    const isNoNavPage = noNavPages.some(path => pathname.startsWith(path));

    useEffect(() => {
        // Don't gate while auth is loading, on auth pages, or on no-nav pages
        if (isLoadingAuth || isNoNavPage || isAuthPage) return;
        // If user is logged in, only gate if KYC is not approved AND not rejected (rejected means they can come to resubmit)
        if (user && user.kyc_status !== 'approved' && user.kyc_status !== 'rejected') {
            router.push('/verify-identity');
        }
    }, [user, isLoadingAuth, pathname, isNoNavPage, isAuthPage, router]);

    if (isAuthPage || isNoNavPage) {
        return (
            <div className="min-h-screen bg-background">
                <Suspense fallback={<div className="min-h-screen bg-background" />}>
                    {children}
                </Suspense>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={null}>
                <Sidebar />
            </Suspense>
            <main className="md:ml-64">
                <Suspense fallback={<div className="p-8"><div className="h-32 w-full animate-pulse bg-muted rounded-3xl" /></div>}>
                    {children}
                </Suspense>
            </main>
            <Suspense fallback={null}>
                <BottomNav />
            </Suspense>
            <QuickTradeButton onClick={() => router.push(createPageUrl('Markets'))} />
            <PwaInstallPrompt />
            <NotificationPrompt />
        </div>
    );
}

"use client";

import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/navigation/Sidebar';
import BottomNav from '@/components/navigation/BottomNav';
import QuickTradeButton from '@/components/common/QuickTradeButton';
import { createPageUrl } from '@/utils';

const authPages = ['/'];
const noNavPages = ['/verify-identity', '/admin-kyc'];

export default function AppContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const isAuthPage = authPages.includes(pathname);
    const isNoNavPage = noNavPages.some(path => pathname.startsWith(path));

    if (isAuthPage || isNoNavPage) {
        return (
            <div className="min-h-screen bg-background">
                {children}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:ml-64">
                {children}
            </main>
            <BottomNav />
            <QuickTradeButton onClick={() => router.push(createPageUrl('Markets'))} />
        </div>
    );
}

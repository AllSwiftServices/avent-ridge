"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export const useNavigate = () => {
  const router = useRouter();
  return (to: string | number) => {
    if (typeof to === 'number') {
      if (to === -1) {
        router.back();
      } else if (to === 1) {
        router.forward();
      }
    } else {
      router.push(to);
    }
  };
};

export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return {
    pathname,
    search: searchParams.toString(),
    hash: '',
    state: null,
    key: 'default',
  };
};

export const useParams = () => {
  // Simple shim, Next.js params are usually passed to the page
  return {};
};

export const Link = ({ to, children, ...props }: any) => {
  return <a href={to} {...props}>{children}</a>;
};

export const BrowserRouter = ({ children }: any) => <>{children}</>;
export const Routes = ({ children }: any) => <>{children}</>;
export const Route = ({ children }: any) => <>{children}</>;

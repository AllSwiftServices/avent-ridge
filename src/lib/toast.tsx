"use client";

import React from 'react';
import { toast as SonnerToast } from 'sonner';
import { CustomToast } from '@/components/ui/CustomToast';

interface ToastOptions {
  description?: string;
  duration?: number;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    SonnerToast.custom((t) => (
      <CustomToast 
        message={message} 
        type="success" 
        description={options?.description} 
        onClose={() => SonnerToast.dismiss(t)} 
      />
    ), { duration: options?.duration || 4000 });
  },
  error: (message: string, options?: ToastOptions) => {
    SonnerToast.custom((t) => (
      <CustomToast 
        message={message} 
        type="error" 
        description={options?.description} 
        onClose={() => SonnerToast.dismiss(t)} 
      />
    ), { duration: options?.duration || 5000 });
  },
  info: (message: string, options?: ToastOptions) => {
    SonnerToast.custom((t) => (
      <CustomToast 
        message={message} 
        type="info" 
        description={options?.description} 
        onClose={() => SonnerToast.dismiss(t)} 
      />
    ), { duration: options?.duration || 4000 });
  },
  loading: (message: string, options?: ToastOptions) => {
    return SonnerToast.custom((t) => (
      <CustomToast 
        message={message} 
        type="loading" 
        description={options?.description} 
        onClose={() => SonnerToast.dismiss(t)} 
      />
    ), { duration: options?.duration || 100000 });
  },
  dismiss: (id?: string | number) => {
    SonnerToast.dismiss(id);
  }
};

export const showToast = toast;

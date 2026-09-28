import type { Metadata } from 'next';
import './globals.css';
import { PromotorProvider } from '@/context/PromotorContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'PROMOTOR V1.0 - Project Monitoring & Material Control',
  description: 'Sistem Terintegrasi Monitoring Proyek, Survey, Daftung, Pengawasan, dan Kontrol Material PLN',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          body { margin: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; }
        `}} />
      </head>
      <body className="min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased selection:bg-pln-500 selection:text-white">
        <ToastProvider>
          <PromotorProvider>{children}</PromotorProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

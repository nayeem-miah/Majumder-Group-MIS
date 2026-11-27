import type { Metadata } from 'next';
import AppToaster from '../components/AppToaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'GarmentFlow MIS | Majumder Group',
  description:
    'Majumder Group GarmentFlow MIS — manufacturing and dispatch operations management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink antialiased">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}

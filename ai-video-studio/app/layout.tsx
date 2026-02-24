import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Video Studio',
  description: 'Production-ready AI video generation platform.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

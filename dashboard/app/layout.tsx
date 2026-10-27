import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VYRA | Phishing Detection',
  description: 'Detect the Unknown. Verify the Evidence. Prevent the Threat.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <div className="fixed inset-0 cyber-grid pointer-events-none z-0" />
        
        {/* Glow backdrop blobs */}
        <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="w-full border-t border-gray-800/80 bg-gray-950/80 backdrop-blur-md py-6 text-xs text-gray-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-300">VYRA</span>
                <span>— Explainable AI & Blockchain-Backed Phishing Defense</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SHA-256 Ledger Node Sync
                </span>
                <span>v1.0.0</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

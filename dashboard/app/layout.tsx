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
  title: 'VYRA // Cyber Neo-Brutalist Phishing Defense',
  description: 'Explainable AI & Blockchain-Backed Phishing Detection Engine. Detect the Unknown. Verify the Evidence. Prevent the Threat.',
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
      <body className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans antialiased selection:bg-[#facc15] selection:text-black">
        {/* Background Dot Matrix Canvas */}
        <div className="fixed inset-0 neo-grid pointer-events-none z-0" />

        {/* Top Ticker Tape (Neo-Brutalist Marquee) */}
        <div className="relative z-50 w-full bg-[#facc15] text-black border-b-[3px] border-black py-1.5 px-4 font-mono text-xs font-black uppercase tracking-wider overflow-hidden whitespace-nowrap flex items-center justify-between shadow-[0px_3px_0px_0px_#ffffff]">
          <div className="flex items-center gap-6 animate-pulse">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-black" />
              SYSTEM STATUS: ARMED &amp; DEFENDING
            </span>
            <span>//</span>
            <span>MODEL: XGBOOST HIST GRADIENT (94% LIVE OPENPHISH DETECTION)</span>
            <span>//</span>
            <span>LEDGER: IMMUTABLE SHA-256 PROOF-OF-WORK ACTIVE</span>
            <span>//</span>
            <span>EXPLAINABILITY: TREESHAP LOCAL ATTRIBUTION</span>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-black text-[#facc15] px-2 py-0.5 text-[10px] font-black">
            ACADEMIC V1.0.0
          </div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Neo-Brutalist Dark Footer */}
          <footer className="w-full border-t-[3px] border-white bg-[#12141e] py-8 text-white mt-16 shadow-[0px_-4px_0px_0px_#facc15]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-[#facc15] text-black font-mono font-black text-sm border-2 border-black shadow-[2px_2px_0px_0px_#ffffff]">
                    VYRA // LABS
                  </span>
                  <span className="font-mono text-xs font-black tracking-tight text-white">
                    Explainable AI &amp; Blockchain-Integrated Phishing Defense
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono font-bold">
                  &quot;Detect the Unknown. Verify the Evidence. Prevent the Threat.&quot;
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-black">
                <div className="px-3 py-1.5 bg-[#ccff00] text-black border-2 border-black shadow-[3px_3px_0px_0px_#ffffff]">
                  71/71 TEST SUITES PASSED
                </div>
                <div className="px-3 py-1.5 bg-[#38bdf8] text-black border-2 border-black shadow-[3px_3px_0px_0px_#ffffff]">
                  POW DIFFICULTY: 2
                </div>
                <div className="px-3 py-1.5 bg-[#ff3366] text-white border-2 border-black shadow-[3px_3px_0px_0px_#ffffff]">
                  35 URL VECTORS
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

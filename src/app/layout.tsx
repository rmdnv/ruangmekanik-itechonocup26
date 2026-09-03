import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RuangMekanik",
  description: "RuangMekanik - panduan perbaikan teknis dan forum diagnosa",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-screen bg-white text-zinc-950">
        <script dangerouslySetInnerHTML={{ __html: `if (location.pathname.startsWith('/admin')) document.body.classList.add('admin-shell')` }} />
        <Providers>
          <div className="site-chrome">
            <SiteHeader />
          </div>
          <div className="site-chrome-spacer h-28 md:h-16" aria-hidden="true" />
          <div className="site-content pb-24 md:pb-0">
            {children}
          </div>
          <div className="site-chrome">
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavBar } from "@/components/nav-bar";
import { MiniPlayer } from "@/components/player/mini-player";
import { ChatWidget } from "@/components/chat/chat-widget";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { Toaster } from "@/components/realtime/toaster";
import { PwaInstall } from "@/components/pwa-install";
import { PushNudge } from "@/components/notifications/push-nudge";
import { AnimatedBackground } from "@/components/animated-background";
import { PageTransition } from "@/components/page-transition";
import { Footer } from "@/components/footer";
import { GlobalSongPlayer } from "@/components/profile/global-song-player";

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "MySpace Reborn";
const description = "The social network MySpace should have become.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: title,
    template: "%s | MySpace Reborn",
  },
  description,
  keywords: [
    "MySpace",
    "social network",
    "retro social media",
    "MySpace Reborn",
    "custom profile themes",
    "blogs",
    "communities",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: title,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
  appleWebApp: {
    capable: true,
    title: "MySpace",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Extend content under the Dynamic Island / home indicator so we can paint
  // edge to edge; safe-area insets are honored in CSS.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="midnight"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          // Apply the saved site theme before paint to avoid a flash of the default theme.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('site-theme');if(t)document.documentElement.setAttribute('data-theme',t);var r=localStorage.getItem('retro-mode');if(r==='on')document.documentElement.setAttribute('data-retro','on');var c=localStorage.getItem('site-cursor');if(c)document.documentElement.setAttribute('data-cursor',c);}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: title,
              description,
              url: baseUrl,
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-white">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
        <Providers>
          <AnimatedBackground />
          <NavBar />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <MiniPlayer />
          <GlobalSongPlayer />
          <ChatWidget />
          <RealtimeProvider />
          <Toaster />
          <PwaInstall />
          <PushNudge />
        </Providers>
      </body>
    </html>
  );
}

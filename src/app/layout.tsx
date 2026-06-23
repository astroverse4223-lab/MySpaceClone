import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavBar } from "@/components/nav-bar";
import { MiniPlayer } from "@/components/player/mini-player";
import { ChatWidget } from "@/components/chat/chat-widget";
import { RealtimeProvider } from "@/components/realtime/realtime-provider";
import { Toaster } from "@/components/realtime/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MySpace Reborn",
  description: "The social network MySpace should have become.",
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
            __html: `try{var t=localStorage.getItem('site-theme');if(t)document.documentElement.setAttribute('data-theme',t);var r=localStorage.getItem('retro-mode');if(r==='on')document.documentElement.setAttribute('data-retro','on');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-white">
        <Providers>
          <NavBar />
          <main className="flex-1">{children}</main>
          <MiniPlayer />
          <ChatWidget />
          <RealtimeProvider />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

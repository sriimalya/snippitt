import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "./providers/SessionProviderWrapper";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Snippit",
  description:
    "Your personal space for collecting and sharing highlights from your favorite content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-800`}
      >
        <SessionProviderWrapper>
          <div className="flex flex-col h-screen overflow-hidden">
            <main className="flex-1 overflow-y-auto hide-scrollbar">
              {children}
            </main>
          </div>
          <Toaster position="top-center" richColors />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

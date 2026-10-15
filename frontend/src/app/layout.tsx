import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

// Self-hosted at build time by next/font: no request to Google from the user's browser.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ACME Salary", template: "%s · ACME Salary" },
  description: "Salary management for ACME HR",
  robots: { index: false, follow: false }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Reading the request makes every page render per request, so each gets its own CSP nonce.
  await headers();
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

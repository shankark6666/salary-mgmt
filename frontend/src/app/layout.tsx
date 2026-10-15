import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

// Inter comes from an npm package, not from Google at build time: builds work offline, and the
// font goes through the same lockfile, release-age and audit checks as every other dependency.
const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap"
});

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

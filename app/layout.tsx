import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "X•ELECTION OS — Colombia 2026 | Live Primary Sources",
  description: "Palantir-grade real-time election intelligence. X primary signals • Grok Better-Search Protocol v3.1 • Zero spin. First round • May 31, 2026",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAF7F2] text-[#1C1A15] overflow-x-hidden antialiased">
        {children}
      </body>
    </html>
  );
}

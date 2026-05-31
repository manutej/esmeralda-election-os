import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESMERALDA — Colombia Election Tracker 2026 | CETI Control Room",
  description: "High-fidelity bilingual Colombia 2026 election tracker (CETI). X primary signals • Heavy seed data • 10:28 COT live prototype. Private source, public Vercel. First round • May 31, 2026",
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

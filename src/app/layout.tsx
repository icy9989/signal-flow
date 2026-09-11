import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalFlow",
  description: "Customer feedback intelligence for product teams. Discover topics, understand sentiment, and explore the evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}><body><ClerkProvider>{children}</ClerkProvider></body></html>;
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PageShell } from "@/components/layout/PageShell";
import { ToastContainer } from "@/components/ui/Toast";
import { MockProvider } from "@/components/MockProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sandbox Playground",
  description:
    "Deploy cloud resources in minutes. Pick a template or build your own configuration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        <MockProvider>
          <PageShell>{children}</PageShell>
          <ToastContainer />
        </MockProvider>
      </body>
    </html>
  );
}

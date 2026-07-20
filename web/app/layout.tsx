import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MainShell } from "@/components/layout/MainShell";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { ToastContainer } from "@/components/ui/Toast";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Sandbox IAC",
  description:
    "Deploy cloud resources in minutes. Pick a template or build your own configuration.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Sandbox IAC",
    description:
      "Deploy cloud resources in minutes. Pick a template or build your own configuration.",
    siteName: "Sandbox IAC",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sandbox IAC",
    description:
      "Deploy cloud resources in minutes. Pick a template or build your own configuration.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <AmbientBackground />
        <Navbar user={user} />
        <MainShell>{children}</MainShell>
        <Footer />
        <ToastContainer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import NextAuthSessionProvider from "@/components/NextAuthSessionProvider";
import ResponsiveLayout from "@/components/layout/ResponsiveLayout";
import { geist } from "./fonts";
import ClientLayout from './ClientLayout';
import Footer from '@/components/layout/Footer';
import { promises as fs } from 'fs';
import path from 'path';
import { SettingsProvider } from '@/components/layout/SettingsProvider';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settingsPath = path.join(process.cwd(), 'data/settings.json');
    const data = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(data);
    return {
      title: settings.siteTitle || 'Manus Blog System',
      description: settings.siteDescription || 'A powerful blog system powered by Next.js and GitHub Pages.',
      keywords: settings.keywords || '',
      openGraph: {
        images: settings.ogImage ? [{ url: settings.ogImage }] : undefined,
      },
      icons: settings.favicon ? { icon: settings.favicon } : undefined,
    };
  } catch {
    return {
      title: "Manus Blog System",
      description: "A powerful blog system powered by Next.js and GitHub Pages.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.className} antialiased min-h-screen`}
      >
        <SettingsProvider>
          <NextAuthSessionProvider>
            <ResponsiveLayout fluid={true} noPadding={true}>
              <ClientLayout>
                {children}
                <Footer />
              </ClientLayout>
            </ResponsiveLayout>
          </NextAuthSessionProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

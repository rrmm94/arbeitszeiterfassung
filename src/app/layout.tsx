import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { AppShell } from "@/components/app-shell";
import { EntryModalProvider } from "@/components/entry-modal-provider";
import { DisplayModeProvider } from "@/components/display-mode-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arbeitszeit",
  description: "Arbeitszeiterfassung für Lehrkräfte",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${inter.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="h-full antialiased">
        <DisplayModeProvider>
          <EntryModalProvider>
            <AppShell>{children}</AppShell>
          </EntryModalProvider>
        </DisplayModeProvider>
      </body>
    </html>
  );
}

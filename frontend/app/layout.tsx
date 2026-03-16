import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "DocuSmart — Traitement Automatique de Documents",
  description: "Plateforme IA de traitement, classification et analyse de conformité de documents administratifs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="animated-gradient min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

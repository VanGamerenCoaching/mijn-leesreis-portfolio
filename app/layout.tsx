import type { Metadata } from "next";
import { PrivacyTools } from "@/components/privacy-tools";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mijn Leesreis Portfolio",
  description: "Een client-side leesportfolio voor leerlingen."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>
        <PrivacyTools />
        {children}
      </body>
    </html>
  );
}

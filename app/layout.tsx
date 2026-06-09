import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}

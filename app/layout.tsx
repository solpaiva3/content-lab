import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Lab",
  description: "Instagram content automation for agencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

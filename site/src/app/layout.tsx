import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Petshop Legacy Site",
  description: "Next.js shell serving legacy baseline HTML pages"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

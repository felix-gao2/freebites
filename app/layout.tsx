import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "freebites — free food in the GTA",
  description: "Personalized calendar of free food deals, birthday freebies, and national food days across the Greater Toronto Area.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EDUCARE AI — UNIGO Digital Learning Ecosystem",
  description: "Hệ sinh thái học tập số Trường Tiểu học và THCS UNIGO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Geist+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}


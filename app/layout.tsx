import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "MESP — Modular Event Social Platform",
  description: "活動社交平台 Prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

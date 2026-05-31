import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "天神書齋 Tenjin Shosai",
  description:
    "Connecting people through events and culture. イベントと文化で人々をつなぐ。",
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

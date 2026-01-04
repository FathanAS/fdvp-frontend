import type { Metadata } from "next";
import "./globals.css";
import "izitoast/dist/css/iziToast.min.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { LanguageProvider } from "@/context/LanguageContext";
import NotiflixInit from "@/components/NotiflixInit";
import ThemeProviderClient from "@/components/ThemeProviderClient";

export const metadata: Metadata = {
  title: "FDVP Community",
  description: "Official Community Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NotiflixInit />
        <AuthProvider>
          <LanguageProvider>
            <NotificationProvider>
              <ThemeProviderClient attribute="class" defaultTheme="system" enableSystem>
                {children}
              </ThemeProviderClient>
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
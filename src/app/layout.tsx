import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Quedamos — De screenshot a plan en segundos",
    template: "%s · Quedamos",
  },
  description:
    "Sube una captura, pega un link o copia un mensaje. Quedamos lo convierte en una ficha compartible para votar, confirmar y recordar.",
  applicationName: "Quedamos",
  authors: [{ name: "Quedamos" }],
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Quedamos",
    title: "Quedamos — De screenshot a plan en segundos",
    description:
      "Convierte capturas, links y mensajes en planes sociales listos para compartir.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}

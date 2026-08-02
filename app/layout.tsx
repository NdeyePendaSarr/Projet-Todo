import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["500", "600", "700"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FocusDay — ta journée, pilotée par le temps",
  description:
    "Planifie tes objectifs par créneaux, reçois des rappels quand l'heure approche, et débriefe ta journée. Un coach de productivité, pas une todo-list.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${space.variable} ${inter.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

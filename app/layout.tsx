import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fractionator · Calcolatrice di frazioni",
  description: "Calcola con le frazioni, visualizza il risultato e scopri ogni passaggio. Senza account.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}

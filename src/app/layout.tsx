import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Little Paws | Chihuahuas & Pomeranians",
  description: "Browse Chihuahua and Pomeranian photos, view current listings, and get in touch with questions."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { Geist } from 'next/font/google'
const geist = Geist({
  subsets: ['latin'],
})


export const metadata: Metadata = {
  title: "Nora reservation",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={geist.className}>
        <body>
           
            {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

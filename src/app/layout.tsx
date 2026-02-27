import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import GlobalLiveChat from "@/components/livechat/GlobalLiveChat";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GetDocuFlight — Visa Predictive Analysis & Travel Documentation",
  description:
    "AI-powered visa approval prediction and professional travel itinerary planning assistance. Streamline your visa documentation with data-driven insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jakarta.variable}`}>
      <body className="antialiased">
        {children}
        <GlobalLiveChat />
      </body>
    </html>
  );
}

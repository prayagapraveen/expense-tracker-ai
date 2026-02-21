import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "SpendWise - Smart Expense Tracking",
  description: "AI-powered expense tracking with gamification, insights, and natural language input",
  keywords: ["expense tracker", "budget", "finance", "money management", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[rgb(var(--background))] antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

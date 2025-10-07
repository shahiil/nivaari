'use client';

import '../styles/globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <HotToaster position="top-right" />
              <Navbar />
              {children}
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

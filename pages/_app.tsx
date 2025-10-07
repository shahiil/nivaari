import { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { Toaster } from "../components/ui/toaster";
import { Toaster as Sonner } from "../components/ui/sonner";
import { TooltipProvider } from "../components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/globals.css";

const queryClient = new QueryClient();
const ClientRouter = dynamic(() => import('../components/ClientRouter'), { ssr: false });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HotToaster position="top-right" />
            <Navbar />
            <Component {...pageProps} />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClientRouter>
  );
}

export default MyApp;

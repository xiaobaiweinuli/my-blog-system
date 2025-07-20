import { AuthProvider } from "@/components/providers/global-auth-context";
import { ThemeProvider } from "@/components/providers/theme-provider";
import React from "react";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
} 
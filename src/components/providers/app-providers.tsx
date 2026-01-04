"use client";

import * as React from "react";
import {ThemeProvider} from "@/components/providers/theme-provider";
import {Toaster} from "@/components/ui/sonner";
import type {Session} from "next-auth";
import {SessionProvider} from "next-auth/react";
import { ProgressBar, ProgressBarProvider } from "react-transition-progress";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function AppProviders({
                               children,
                               session,
                             }: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <ThemeProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SessionProvider>
          <ProgressBarProvider>
            <ProgressBar className="fixed left-0 top-0 z-50 h-1 w-full bg-primary/70 shadow-sm" />
            {children}
          </ProgressBarProvider>

          <Toaster />
          <Analytics />
          <SpeedInsights />
        </SessionProvider>
      </ThemeProvider>
    </ThemeProvider>
  );
}
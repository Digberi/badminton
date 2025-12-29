"use client";

import * as React from "react";
import {ThemeProvider} from "@/components/providers/theme-provider";
import {Toaster} from "@/components/ui/sonner";
import type {Session} from "next-auth";
import {SessionProvider} from "next-auth/react";

export function AppProviders({
                               children,
                               session,
                             }: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        {children}
        <Toaster richColors closeButton/>
      </SessionProvider>
    </ThemeProvider>
  );
}
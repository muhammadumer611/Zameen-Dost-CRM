"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange
      // ✅ Script props ko customize karo
      scriptProps={{
        "data-nscript": "afterInteractive",
        strategy: "afterInteractive",
        suppressHydrationWarning: true,
      }}
    >
      {children}
    </NextThemesProvider>
  );
}
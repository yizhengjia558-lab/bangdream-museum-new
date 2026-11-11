import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { GlobalSearchProvider } from "@/components/search/GlobalSearchProvider";
import { DocumentLocale } from "@/components/i18n/DocumentLocale";
import { BangDreamPageBackground } from "@/components/effects/BangDreamPageBackground";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { VisitTracker } from "@/components/analytics/VisitTracker";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Hint browsers on high-refresh displays to keep input/compositor responsive.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1020" },
  ],
};

export const metadata: Metadata = {
  title: "BanG Dream! — Digital Character Museum",
  description: "An immersive digital museum for BanG Dream! Girls Band Party!",
};

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=M+PLUS+Rounded+1c:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Outfit:wght@700;800&family=Plus+Jakarta+Sans:wght@600;700&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full" data-theme="light" data-locale="zh" data-perf="hi" suppressHydrationWarning>
      <head>
        {/* Load fonts in the browser — avoid next/font/google build-time fetches that break CI. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      </head>
      <body className="theme-body flex min-h-full flex-col font-[family-name:var(--font-body-active)]">
        <BangDreamPageBackground />
        <LocaleProvider>
          <DocumentLocale />
          <VisitTracker />
          <GlobalSearchProvider>
            <FavoritesProvider>
              <AuthProvider>
                <ThemeProvider>
                  <SmoothScroll>
                    <LanguageToggle className="lang-toggle-fixed" />
                    <ThemeToggle className="theme-toggle-fixed" />
                    <ScrollToTopButton />
                    <SiteHeader />
                    <main className="relative flex-1">{children}</main>
                    <SiteFooter />
                    <MobileBottomNav />
                    <AuthModal />
                  </SmoothScroll>
                </ThemeProvider>
              </AuthProvider>
            </FavoritesProvider>
          </GlobalSearchProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

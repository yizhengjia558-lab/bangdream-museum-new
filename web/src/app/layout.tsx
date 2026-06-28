import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Inter, M_PLUS_Rounded_1c, Noto_Sans_SC } from "next/font/google";
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

const fontTitle = Outfit({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const fontSubtitle = Plus_Jakarta_Sans({
  variable: "--font-subtitle",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const fontJp = M_PLUS_Rounded_1c({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const fontZh = Noto_Sans_SC({
  variable: "--font-zh",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BanG Dream! — Digital Character Museum",
  description: "An immersive digital museum for BanG Dream! Girls Band Party!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${fontTitle.variable} ${fontSubtitle.variable} ${fontBody.variable} ${fontJp.variable} ${fontZh.variable} h-full`}
      data-theme="light"
      data-locale="zh"
      suppressHydrationWarning
    >
      <body className="theme-body flex min-h-full flex-col font-[family-name:var(--font-body-active)] antialiased">
        <BangDreamPageBackground />
        <LocaleProvider>
          <DocumentLocale />
          <GlobalSearchProvider>
            <FavoritesProvider>
              <ThemeProvider>
                <SmoothScroll>
                  <LanguageToggle className="lang-toggle-fixed" />
                  <ThemeToggle className="theme-toggle-fixed" />
                  <ScrollToTopButton />
                  <SiteHeader />
                  <main className="relative flex-1">{children}</main>
                  <SiteFooter />
                </SmoothScroll>
              </ThemeProvider>
            </FavoritesProvider>
          </GlobalSearchProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { SettingsProvider } from "@/contexts/SettingsContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Data Analyst — ask your spreadsheet a question",
  description: "Upload a CSV and ask plain-English questions about your data.",
};

const noFlashScript = `
(function() {
  try {
    var stored = localStorage.getItem("ai-data-analyst:settings");
    var theme = stored ? JSON.parse(stored).theme : null;
    document.documentElement.classList.add(theme === "light" ? "light" : "dark");
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
    variable: "--mono",
    subsets: ["latin"],
    fallback: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "Liberation Mono",
        "Courier New",
        "monospace",
    ],
});

export const metadata: Metadata = {
    title: {
        default: "Ladicloc — Instant Code & Repository Statistics",
        template: "%s | Ladicloc",
    },
    description:
        "Analyze lines of code, comments, and blank space across any public Git repository or local zip archive.",
    keywords: ["line counter", "cloc", "code metrics", "repository analyzer", "git stats"],
};

const themeScript = `try{var t=localStorage.getItem("theme");var d=t==="dark"||((t===null||t==="auto")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${mono.variable} h-full antialiased`} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}

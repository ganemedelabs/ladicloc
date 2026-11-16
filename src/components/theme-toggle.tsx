"use client";

import { useTheme } from "@/components/theme-provider";
import { useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark" | "auto";

const icon = (children: ReactNode) => (
    <svg
        className="size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const OPTIONS: { value: Theme; label: string; icon: ReactNode }[] = [
    {
        value: "light",
        label: "Light",
        icon: icon(
            <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </>
        ),
    },
    {
        value: "auto",
        label: "Auto",
        icon: icon(
            <>
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
            </>
        ),
    },
    {
        value: "dark",
        label: "Dark",
        icon: icon(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />),
    },
];

const subscribe = () => () => {};

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const mounted = useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    );

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className="border-line bg-panel-subtle inline-flex rounded-lg border p-0.5 text-xs font-medium"
        >
            {OPTIONS.map((o) => {
                const active = mounted && theme === o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={o.label}
                        title={o.label}
                        onClick={() => setTheme(o.value)}
                        className={`flex cursor-pointer items-center justify-center rounded-md p-1.5 transition-colors ${
                            active ? "bg-panel text-ink shadow-xs" : "text-soft hover:text-ink"
                        }`}
                    >
                        {o.icon}
                    </button>
                );
            })}
        </div>
    );
}

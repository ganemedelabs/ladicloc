"use client";

import Dashboard from "@/components/dashboard";
import ThemeToggle from "@/components/theme-toggle";
import { groupKey, summarize } from "@/lib/summary";
import { buildTree } from "@/lib/tree";
import { FileStat, GroupBy } from "@/lib/types";
import Image from "next/image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};

function CurrentYear() {
    const year = useSyncExternalStore(
        subscribe,
        () => new Date().getFullYear(),
        () => 2026
    );
    return <>{year}</>;
}

type Progress = {
    phase: "uploading" | "downloading" | "analyzing";
    loaded?: number;
    total?: number;
};

function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    const units = ["KB", "MB", "GB", "TB"];
    let i = -1;
    do {
        n /= 1024;
        i++;
    } while (n >= 1024 && i < units.length - 1);
    return `${n.toFixed(n < 10 ? 2 : 1)} ${units[i]}`;
}

function progressLabel(p: Progress) {
    if (p.phase === "analyzing") return "Analyzing files…";
    const verb = p.phase === "uploading" ? "Uploading" : "Downloading";
    if (p.loaded == null) return `${verb}…`;
    return p.total ? `${verb} ${formatBytes(p.loaded)} / ${formatBytes(p.total)}` : `${verb} ${formatBytes(p.loaded)}`;
}

export default function Page() {
    const [url, setUrl] = useState("");
    const [files, setFiles] = useState<FileStat[]>([]);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [off, setOff] = useState<Set<string>>(new Set());
    const [offLangs, setOffLangs] = useState<Set<string>>(new Set());
    const [groupBy, setGroupBy] = useState<GroupBy>("language");
    const [open, setOpen] = useState<Set<string>>(new Set());
    const [progress, setProgress] = useState<Progress | null>(null);
    const [dragging, setDragging] = useState(false);

    const scan = (targetUrl: string, body: XMLHttpRequestBodyInit, headers?: Record<string, string>) => {
        setLoading(true);
        setError("");
        setProgress({
            phase: body instanceof FormData ? "uploading" : "downloading",
        });

        return new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/scan");
            for (const [k, v] of Object.entries(headers ?? {})) xhr.setRequestHeader(k, v);

            let seen = 0;
            let finished = false;

            const handle = (line: string) => {
                const msg = JSON.parse(line);
                if (msg.type === "progress") {
                    setProgress({
                        phase: msg.phase,
                        loaded: msg.loaded,
                        total: msg.total,
                    });
                } else if (msg.type === "error") {
                    finished = true;
                    setError(msg.error);
                } else if (msg.type === "done") {
                    finished = true;
                    setFiles(msg.files);
                    setName(msg.name);
                    setUrl(targetUrl);
                    setOff(new Set());
                    setOffLangs(new Set());
                    setOpen(new Set());
                }
            };

            const drain = () => {
                const text = xhr.responseText;
                const end = text.lastIndexOf("\n");
                if (end < seen) return;
                text.slice(seen, end).split("\n").filter(Boolean).forEach(handle);
                seen = end + 1;
            };

            xhr.upload.onprogress = (e) =>
                e.lengthComputable && setProgress({ phase: "uploading", loaded: e.loaded, total: e.total });
            xhr.onprogress = drain;
            xhr.onload = () => {
                drain();
                if (!finished) setError("Scan failed.");
            };
            xhr.onerror = () => setError("Network error.");
            xhr.onloadend = () => {
                setLoading(false);
                setProgress(null);
                resolve();
            };
            xhr.send(body);
        });
    };

    const scanZip = (file: File) => {
        if (!file.name.toLowerCase().endsWith(".zip")) {
            setError("Only .zip archives are supported.");
            return;
        }
        const fd = new FormData();
        fd.append("file", file);
        scan("", fd);
    };

    useEffect(() => {
        let depth = 0;
        const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

        const onEnter = (e: DragEvent) => {
            if (!hasFiles(e)) return;
            e.preventDefault();
            depth++;
            setDragging(true);
        };
        const onOver = (e: DragEvent) => {
            if (!hasFiles(e)) return;
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = loading ? "none" : "copy";
        };
        const onLeave = (e: DragEvent) => {
            if (!hasFiles(e)) return;
            depth = Math.max(0, depth - 1);
            if (depth === 0) setDragging(false);
        };
        const onDrop = (e: DragEvent) => {
            if (!hasFiles(e)) return;
            e.preventDefault();
            depth = 0;
            setDragging(false);
            if (loading) return;
            const f = e.dataTransfer?.files?.[0];
            if (f) scanZip(f);
        };

        window.addEventListener("dragenter", onEnter);
        window.addEventListener("dragover", onOver);
        window.addEventListener("dragleave", onLeave);
        window.addEventListener("drop", onDrop);
        return () => {
            window.removeEventListener("dragenter", onEnter);
            window.removeEventListener("dragover", onOver);
            window.removeEventListener("dragleave", onLeave);
            window.removeEventListener("drop", onDrop);
            setDragging(false);
        };
    }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

    const changeGroupBy = (g: GroupBy) => {
        setGroupBy(g);
        setOffLangs(new Set());
    };

    const tree = useMemo(() => buildTree(files.map((f) => f.path)), [files]);
    const byPath = useMemo(() => new Map(files.map((f) => [f.path, f])), [files]);
    const available = useMemo(() => files.filter((f) => !off.has(f.path)), [files, off]);
    const { rows } = useMemo(() => summarize(available, groupBy), [available, groupBy]);
    const counted = useMemo(
        () => available.filter((f) => !offLangs.has(groupKey(f, groupBy))),
        [available, offLangs, groupBy]
    );
    const countedPaths = useMemo(() => new Set(counted.map((f) => f.path)), [counted]);
    const { total } = useMemo(() => summarize(counted, groupBy), [counted, groupBy]);

    const hasResults = files.length > 0;

    return (
        <div className="flex min-h-full flex-col justify-between">
            {dragging && (
                <div
                    className="bg-ground/80 pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
                    aria-hidden="true"
                >
                    <div
                        className={`border-code bg-panel flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-8 py-14 text-center shadow-xl ${
                            loading ? "opacity-60" : "animate-pulse"
                        }`}
                    >
                        <svg
                            className="text-code size-10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p className="text-ink text-lg font-semibold">
                            {loading ? "Scan in progress" : "Drop your .zip to analyze"}
                        </p>
                        <p className="text-soft text-sm">
                            {loading
                                ? "Wait for the current scan to finish."
                                : "Release anywhere to start counting lines."}
                        </p>
                    </div>
                </div>
            )}

            <main className="mx-auto w-full max-w-7xl px-4 pt-10 pb-24 sm:px-6 lg:px-8">
                <header
                    className={`transition-all duration-300 ${hasResults ? "mb-8" : "mx-auto mt-16 max-w-2xl text-center"}`}
                >
                    <div className={`mb-4 flex items-center gap-3 ${hasResults ? "" : "justify-center"}`}>
                        <Image
                            src="/images/logo.png"
                            width={36}
                            height={36}
                            className="border-line rounded-xl border shadow-2xs"
                            alt="Ladicloc Logo"
                        />
                        <h1 className="text-ink text-2xl font-bold tracking-tight sm:text-3xl">Ladicloc</h1>
                    </div>

                    {!hasResults && (
                        <p className="text-soft mx-auto mb-8 max-w-xl text-base leading-relaxed">
                            Analyze lines of code, comments, and blank space across any public Git repository or local{" "}
                            <code className="border-line bg-panel text-ink rounded-md border px-1.5 py-0.5 font-mono text-xs font-semibold">
                                .zip
                            </code>{" "}
                            archive with instantaneous depth.
                        </p>
                    )}

                    <form
                        className="flex flex-wrap items-stretch gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (url.trim())
                                scan(url, JSON.stringify({ url }), {
                                    "Content-Type": "application/json",
                                });
                        }}
                    >
                        <div className="relative min-w-0 flex-[1_1_320px]">
                            <svg
                                className="text-soft pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                            </svg>

                            <input
                                className="border-line bg-panel text-ink placeholder:text-soft/50 hover:border-soft/40 focus:border-code w-full rounded-xl border py-3 pr-36 pl-11 font-mono text-sm shadow-2xs transition-colors focus:outline-none"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://github.com/owner/repo"
                                inputMode="url"
                                aria-label="Repository URL"
                            />

                            <button
                                type="submit"
                                className="border-code bg-code text-ground absolute top-1/2 right-1.5 inline-flex -translate-y-1/2 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-1.5 text-sm font-semibold shadow-xs transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loading || !url.trim()}
                            >
                                {loading && (
                                    <span className="border-ground size-4 animate-spin rounded-full border-2 border-t-transparent" />
                                )}
                                {loading ? "Scanning…" : "Count lines"}
                            </button>
                        </div>

                        <label className="border-line bg-panel text-ink hover:border-soft/40 hover:bg-panel-subtle inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xs transition-colors">
                            <svg
                                className="text-soft size-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload .zip
                            <input
                                type="file"
                                accept=".zip"
                                hidden
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) scanZip(f);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    </form>

                    {loading && progress && (
                        <div className="text-soft mt-3 text-left font-mono text-xs" aria-live="polite">
                            <div className="flex justify-between">
                                <span>{progressLabel(progress)}</span>
                                {progress.total && progress.loaded != null && (
                                    <span>{Math.round((progress.loaded / progress.total) * 100)}%</span>
                                )}
                            </div>
                            <div className="bg-line mt-1.5 h-1 overflow-hidden rounded-full">
                                <div
                                    className={`bg-code h-full ${progress.total ? "transition-[width]" : "w-1/3 animate-pulse"}`}
                                    style={
                                        progress.total && progress.loaded != null
                                            ? {
                                                  width: `${(progress.loaded / progress.total) * 100}%`,
                                              }
                                            : undefined
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="border-warn/30 bg-warn/10 text-warn mt-4 flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm"
                        >
                            <svg
                                className="size-5 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {!hasResults && !loading && !error && (
                        <div className="text-soft mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="bg-code size-1.5 rounded-full" />
                                Supports GitHub, GitLab, Bitbucket &amp; public Git URLs
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="bg-soft size-1.5 rounded-full" />
                                Filterable by language &amp; directory hierarchy
                            </span>
                        </div>
                    )}
                </header>

                {loading && !hasResults && (
                    <div className="mx-auto mt-12 max-w-4xl space-y-5">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className="border-line bg-panel h-24 animate-pulse rounded-2xl border p-4 shadow-xs"
                                />
                            ))}
                        </div>
                        <div className="border-line bg-panel h-72 animate-pulse rounded-2xl border p-6 shadow-xs" />
                    </div>
                )}

                {hasResults && (
                    <Dashboard
                        name={name}
                        files={files}
                        total={total}
                        rows={rows}
                        offLangs={offLangs}
                        setOffLangs={setOffLangs}
                        groupBy={groupBy}
                        onGroupByChange={changeGroupBy}
                        tree={tree}
                        byPath={byPath}
                        countedPaths={countedPaths}
                        off={off}
                        setOff={setOff}
                        open={open}
                        setOpen={setOpen}
                        loading={loading}
                    />
                )}
            </main>

            <footer className="border-line text-soft border-t py-6 text-center text-xs">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
                    <p>
                        © <CurrentYear /> Ganemede Labs. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/ganemedelabs/ladicloc"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink hover:text-code inline-flex items-center gap-1.5 font-medium transition-colors"
                        >
                            <svg
                                className="size-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                <path d="M9 18c-4.51 2-5-2-7-2" />
                            </svg>
                            App is open source on GitHub
                        </a>
                        <ThemeToggle />
                    </div>
                </div>
            </footer>
        </div>
    );
}

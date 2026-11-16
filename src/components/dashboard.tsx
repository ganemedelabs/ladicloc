"use client";

import FileTree from "@/components/file-tree";
import LangIcon from "@/components/lang-icon";
import { OTHER_NAME } from "@/lib/languages";
import { extKey } from "@/lib/path";
import type { FileStat, GroupBy, LangRow, TreeNode } from "@/lib/types";
import { Dispatch, Fragment, SetStateAction, useMemo, useState } from "react";

const panel = "rounded-2xl border border-line bg-panel shadow-xs transition-all";
const h2 = "text-lg font-bold tracking-tight text-ink";
const cell = "px-4 py-3.5 text-right whitespace-nowrap first:text-left first:font-sans";
const headCell = `${cell} border-b border-line bg-panel-subtle font-sans text-xs font-semibold uppercase tracking-wider text-soft`;
const barCell = "w-[28%] min-w-[150px] pl-4!";

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0%");

function RatioBar({ row }: { row: LangRow }) {
    return (
        <div className="bg-panel-subtle border-line flex h-2 w-full overflow-hidden rounded-full border">
            <div className="bg-code rounded-l-full" style={{ width: `${(row.code / row.total) * 100}%` }} />
            <div className="bg-comment" style={{ width: `${(row.comment / row.total) * 100}%` }} />
            <div className="bg-blank rounded-r-full" style={{ width: `${(row.blank / row.total) * 100}%` }} />
        </div>
    );
}

type DashboardProps = {
    name: string;
    files: FileStat[];
    total: LangRow;
    rows: LangRow[];
    offLangs: Set<string>;
    setOffLangs: Dispatch<SetStateAction<Set<string>>>;
    groupBy: GroupBy;
    onGroupByChange: (g: GroupBy) => void; // eslint-disable-line no-unused-vars
    tree: TreeNode;
    byPath: Map<string, FileStat>;
    countedPaths: Set<string>;
    off: Set<string>;
    setOff: Dispatch<SetStateAction<Set<string>>>;
    open: Set<string>;
    setOpen: Dispatch<SetStateAction<Set<string>>>;
    loading: boolean;
};

export default function Dashboard({
    name,
    files,
    total,
    rows,
    offLangs,
    setOffLangs,
    groupBy,
    onGroupByChange,
    tree,
    byPath,
    countedPaths,
    off,
    setOff,
    open,
    setOpen,
    loading,
}: DashboardProps) {
    const [otherOpen, setOtherOpen] = useState(false);

    const otherRows = useMemo(() => {
        const map = new Map<string, LangRow>();
        for (const f of files) {
            if (f.lang !== OTHER_NAME || !countedPaths.has(f.path)) continue;
            const key = extKey(f.path);
            const r = map.get(key) ?? {
                lang: key,
                iconLang: key,
                files: 0,
                code: 0,
                comment: 0,
                blank: 0,
                total: 0,
            };
            r.files++;
            r.code += f.code;
            r.comment += f.comment;
            r.blank += f.blank;
            r.total += f.total;
            map.set(key, r);
        }
        return [...map.values()].sort((a, b) => b.code - a.code || b.total - a.total);
    }, [files, countedPaths]);

    const allLangsOn = offLangs.size === 0;

    const toggleLang = (lang: string) =>
        setOffLangs((prev) => {
            const next = new Set(prev);
            if (next.has(lang)) next.delete(lang);
            else next.add(lang);
            return next;
        });

    return (
        <div className={`space-y-6 transition-opacity duration-300 ${loading ? "pointer-events-none opacity-50" : ""}`}>
            {/* Repository Title + Overview KPIs */}
            <div className="border-line flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
                <div>
                    <span className="text-soft text-xs font-semibold tracking-wider uppercase">
                        Repository Breakdown
                    </span>
                    <h2 className="text-ink mt-0.5 font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
                        {name}
                    </h2>
                </div>
                <div className="text-soft bg-panel-subtle border-line rounded-lg border px-3 py-1.5 text-xs sm:text-right">
                    Counting <strong className="text-ink font-mono font-bold">{fmt(total.files)}</strong> of{" "}
                    <strong className="text-ink font-mono font-bold">{fmt(files.length)}</strong> scanned files
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className={`${panel} hover:border-soft/40 p-5`}>
                    <div className="text-soft mb-2 flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                            <span className="bg-code inline-block size-2.5 rounded-sm" />
                            Code Lines
                        </span>
                        <span className="font-mono text-xs">{pct(total.code, total.total)}</span>
                    </div>
                    <div className="text-ink font-mono text-2xl font-bold tracking-tight">{fmt(total.code)}</div>
                </div>

                <div className={`${panel} hover:border-soft/40 p-5`}>
                    <div className="text-soft mb-2 flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                            <span className="bg-comment inline-block size-2.5 rounded-sm" />
                            Comments
                        </span>
                        <span className="font-mono text-xs">{pct(total.comment, total.total)}</span>
                    </div>
                    <div className="text-ink font-mono text-2xl font-bold tracking-tight">{fmt(total.comment)}</div>
                </div>

                <div className={`${panel} hover:border-soft/40 p-5`}>
                    <div className="text-soft mb-2 flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                            <span className="bg-blank inline-block size-2.5 rounded-sm" />
                            Blank Lines
                        </span>
                        <span className="font-mono text-xs">{pct(total.blank, total.total)}</span>
                    </div>
                    <div className="text-ink font-mono text-2xl font-bold tracking-tight">{fmt(total.blank)}</div>
                </div>

                <div className={`${panel} hover:border-soft/40 p-5`}>
                    <div className="text-soft mb-2 flex items-center justify-between text-xs font-medium">
                        <span>Total Lines</span>
                        <span className="font-mono text-xs">
                            {rows.length - offLangs.size} {groupBy === "language" ? "langs" : "exts"}
                        </span>
                    </div>
                    <div className="text-ink font-mono text-2xl font-bold tracking-tight">{fmt(total.total)}</div>
                </div>
            </div>

            {/* Main Grid: Language Table + File Tree */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <section className={`${panel} overflow-hidden`}>
                    {/* Card Header + Overall Composition Bar */}
                    <div className="border-line border-b p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h3 className={h2}>Languages</h3>
                            <div className="flex items-stretch gap-2">
                                <div
                                    role="group"
                                    aria-label="Group by"
                                    className="border-line bg-panel-subtle inline-flex rounded-lg border p-0.5 text-xs font-medium"
                                >
                                    {(["language", "extension"] as const).map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            aria-pressed={groupBy === g}
                                            onClick={() => onGroupByChange(g)}
                                            className={`cursor-pointer rounded-md px-3 py-1 capitalize transition-colors ${
                                                groupBy === g
                                                    ? "bg-panel text-ink shadow-xs"
                                                    : "text-soft hover:text-ink"
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>

                                {rows.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOffLangs(allLangsOn ? new Set(rows.map((r) => r.lang)) : new Set())
                                        }
                                        className="border-line bg-panel-subtle text-soft hover:text-ink inline-flex cursor-pointer items-center rounded-lg border px-3 py-1 text-xs font-medium transition-colors"
                                    >
                                        {allLangsOn ? "Deselect all" : "Select all"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Global Ratio Bar */}
                        {total.total > 0 && (
                            <div className="bg-panel-subtle border-line flex h-3 w-full overflow-hidden rounded-full border p-0.5">
                                <div
                                    className="bg-code rounded-l-full transition-all duration-300"
                                    style={{ width: `${(total.code / total.total) * 100}%` }}
                                    title={`Code: ${fmt(total.code)} (${pct(total.code, total.total)})`}
                                />
                                <div
                                    className="bg-comment transition-all duration-300"
                                    style={{ width: `${(total.comment / total.total) * 100}%` }}
                                    title={`Comments: ${fmt(total.comment)} (${pct(total.comment, total.total)})`}
                                />
                                <div
                                    className="bg-blank rounded-r-full transition-all duration-300"
                                    style={{ width: `${(total.blank / total.total) * 100}%` }}
                                    title={`Blank: ${fmt(total.blank)} (${pct(total.blank, total.total)})`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Breakdown Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse font-mono text-[13px]">
                            <thead>
                                <tr>
                                    <th className={headCell}>{groupBy === "language" ? "Language" : "Extension"}</th>
                                    <th className={headCell}>Files</th>
                                    <th className={headCell}>Code</th>
                                    <th className={headCell}>Comments</th>
                                    <th className={headCell}>Blank</th>
                                    <th className={headCell}>Total</th>
                                    <th className={`${headCell} ${barCell}`}>Distribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-line divide-y">
                                {rows.map((r) => {
                                    const on = !offLangs.has(r.lang);
                                    const expandable = r.lang === OTHER_NAME && otherRows.length > 0;
                                    return (
                                        <Fragment key={r.lang}>
                                            <tr
                                                className={`hover:bg-panel-subtle transition-colors ${on ? "" : "opacity-40"}`}
                                            >
                                                <td className={cell}>
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {expandable ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setOtherOpen((v) => !v)}
                                                                aria-expanded={otherOpen}
                                                                aria-label={
                                                                    otherOpen ? "Collapse Other" : "Expand Other"
                                                                }
                                                                className="text-soft hover:text-ink -ml-1 flex size-5 cursor-pointer items-center justify-center rounded transition-colors"
                                                            >
                                                                <svg
                                                                    viewBox="0 0 16 16"
                                                                    className={`size-3.5 transition-transform ${otherOpen ? "rotate-90" : ""}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <path d="M6 3l5 5-5 5" />
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <span className="-ml-1 size-5" />
                                                        )}
                                                        <label className="inline-flex cursor-pointer items-center gap-2.5 font-sans select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={on}
                                                                onChange={() => toggleLang(r.lang)}
                                                                aria-label={`Count ${r.lang}`}
                                                                className="border-line accent-code size-4 cursor-pointer rounded"
                                                            />
                                                            <LangIcon lang={r.iconLang} />
                                                            <span className="text-ink font-medium">{r.lang}</span>
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className={`${cell} text-soft tabular-nums`}>{fmt(r.files)}</td>
                                                <td className={`${cell} text-ink font-medium tabular-nums`}>
                                                    {fmt(r.code)}
                                                </td>
                                                <td className={`${cell} text-soft tabular-nums`}>{fmt(r.comment)}</td>
                                                <td className={`${cell} text-soft tabular-nums`}>{fmt(r.blank)}</td>
                                                <td className={`${cell} text-ink font-semibold tabular-nums`}>
                                                    {fmt(r.total)}
                                                </td>
                                                <td className={`${cell} ${barCell}`}>
                                                    {r.total > 0 && <RatioBar row={r} />}
                                                </td>
                                            </tr>

                                            {expandable &&
                                                otherOpen &&
                                                otherRows.map((o) => (
                                                    <tr
                                                        key={`other:${o.lang}`}
                                                        className={`bg-panel-subtle/40 hover:bg-panel-subtle transition-colors ${on ? "" : "opacity-40"}`}
                                                    >
                                                        <td className={`${cell} text-soft pl-16! font-mono text-xs`}>
                                                            <span className="inline-flex items-center gap-2.5">
                                                                <LangIcon lang={o.iconLang} />
                                                                {o.lang}
                                                            </span>
                                                        </td>
                                                        <td className={`${cell} text-soft tabular-nums`}>
                                                            {fmt(o.files)}
                                                        </td>
                                                        <td className={`${cell} text-ink tabular-nums`}>
                                                            {fmt(o.code)}
                                                        </td>
                                                        <td className={`${cell} text-soft tabular-nums`}>
                                                            {fmt(o.comment)}
                                                        </td>
                                                        <td className={`${cell} text-soft tabular-nums`}>
                                                            {fmt(o.blank)}
                                                        </td>
                                                        <td className={`${cell} text-ink tabular-nums`}>
                                                            {fmt(o.total)}
                                                        </td>
                                                        <td className={`${cell} ${barCell}`}>
                                                            {o.total > 0 && <RatioBar row={o} />}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <FileTree
                    tree={tree}
                    byPath={byPath}
                    counted={countedPaths}
                    off={off}
                    setOff={setOff}
                    open={open}
                    setOpen={setOpen}
                    className={`${panel} sticky top-6 max-h-[calc(100vh-3rem)] p-5`}
                    headingClassName={h2}
                />
            </div>
        </div>
    );
}

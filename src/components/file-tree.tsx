"use client";

import type { FileStat, TreeNode } from "@/lib/types";
import { useEffect, useMemo, useRef, type Dispatch, type ReactNode, type SetStateAction } from "react";

function Check({
    checked,
    mixed,
    onChange,
    label,
}: {
    checked: boolean;
    mixed: boolean;
    onChange: () => void;
    label: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = mixed;
    }, [mixed]);
    return (
        <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-label={label}
            className="border-line accent-code focus-visible:ring-code size-4 cursor-pointer rounded transition-colors focus-visible:ring-2"
        />
    );
}

type FileTreeProps = {
    tree: TreeNode;
    byPath: Map<string, FileStat>;
    counted: Set<string>;
    off: Set<string>;
    setOff: Dispatch<SetStateAction<Set<string>>>;
    open: Set<string>;
    setOpen: Dispatch<SetStateAction<Set<string>>>;
    className?: string;
    headingClassName?: string;
};

export default function FileTree({
    tree,
    byPath,
    counted,
    off,
    setOff,
    open,
    setOpen,
    className = "",
    headingClassName = "",
}: FileTreeProps) {
    const toggle = (node: TreeNode) =>
        setOff((prev) => {
            const next = new Set(prev);
            const allOn = node.files.every((p) => !prev.has(p));
            node.files.forEach((p) => (allOn ? next.add(p) : next.delete(p)));
            return next;
        });

    const flip = (path: string) =>
        setOpen((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });

    const folderPaths = useMemo(() => {
        const out: string[] = [];
        const walk = (n: TreeNode) => {
            if (n.isFile) return;
            out.push(n.path);
            n.children.forEach(walk);
        };
        tree.children.forEach(walk);
        return out;
    }, [tree]);

    const allFilesOn = off.size === 0;
    const allExpanded = folderPaths.length > 0 && folderPaths.every((p) => open.has(p));

    const renderNode = (n: TreeNode, depth: number): ReactNode => {
        const on = n.files.filter((p) => !off.has(p)).length;
        const live = n.files.some((p) => counted.has(p));
        const lines = n.files.reduce((s, p) => (counted.has(p) ? s + (byPath.get(p)?.total ?? 0) : s), 0);
        const isOpen = open.has(n.path);

        return (
            <li key={n.path} className="select-none">
                <div
                    className={`group hover:bg-panel-subtle flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                        live ? "text-ink" : "text-soft/40 opacity-40"
                    }`}
                    style={{ paddingLeft: Math.max(8, depth * 14) }}
                >
                    {/* Folder Arrow or Empty Spacer for Files */}
                    {n.isFile ? (
                        <span className="size-4 shrink-0" aria-hidden="true" />
                    ) : (
                        <button
                            type="button"
                            className="text-soft hover:bg-line hover:text-ink flex size-4 shrink-0 cursor-pointer items-center justify-center rounded transition-colors"
                            onClick={() => flip(n.path)}
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Collapse" : "Expand"} ${n.name}`}
                        >
                            <svg
                                className={`size-3 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    )}

                    {/* Checkbox */}
                    <Check
                        checked={on === n.files.length}
                        mixed={on > 0 && on < n.files.length}
                        onChange={() => toggle(n)}
                        label={`Include ${n.name}`}
                    />

                    {/* Folder or File Icon */}
                    {n.isFile ? (
                        <span className="text-soft flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                            <svg
                                className="size-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                        </span>
                    ) : (
                        <svg
                            className="text-soft size-3.5 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                    )}

                    {/* Label */}
                    <span className="min-w-0 flex-1 truncate font-mono text-xs" title={n.path}>
                        {n.name}
                    </span>

                    {/* Line count */}
                    {lines > 0 && (
                        <span className="text-soft shrink-0 font-mono text-[11px] tabular-nums">
                            {lines.toLocaleString("en-US")}
                        </span>
                    )}
                </div>

                {!n.isFile && isOpen && (
                    <ul className="m-0 mt-0.5 list-none space-y-0.5 p-0">
                        {n.children.map((c) => renderNode(c, depth + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <aside className={`${className} flex flex-col`}>
            <div className="border-line mb-3 flex items-center justify-between border-b pb-3">
                <h3 className={headingClassName}>File tree</h3>
                <div className="flex items-stretch gap-2">
                    <button
                        type="button"
                        className="border-line bg-panel-subtle text-soft hover:text-ink inline-flex cursor-pointer items-center rounded-lg border px-3 py-1 text-xs font-medium transition-colors"
                        onClick={() => setOff(allFilesOn ? new Set(byPath.keys()) : new Set())}
                    >
                        {allFilesOn ? "Deselect all" : "Select all"}
                    </button>
                    <button
                        type="button"
                        className="border-line bg-panel-subtle text-soft hover:text-ink inline-flex cursor-pointer items-center rounded-lg border px-3 py-1 text-xs font-medium transition-colors"
                        onClick={() => setOpen(allExpanded ? new Set() : new Set(folderPaths))}
                    >
                        {allExpanded ? "Collapse all" : "Expand all"}
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <ul className="m-0 list-none space-y-0.5 p-0">{tree.children.map((c) => renderNode(c, 0))}</ul>
            </div>
        </aside>
    );
}

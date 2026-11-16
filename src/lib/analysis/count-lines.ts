import type { Syntax } from "../types";

export function countLines(text: string, syntax: Syntax) {
    let code = 0,
        comment = 0,
        blank = 0;
    let closer: string | null = null;
    const lines = text.split(/\r?\n/);
    if (lines[lines.length - 1] === "") lines.pop();

    for (const raw of lines) {
        const line = raw.trim();
        if (closer) {
            const i = line.indexOf(closer);
            if (i === -1) {
                comment++;
                continue;
            }
            const rest = line.slice(i + closer.length).trim();
            closer = null;
            if (rest) code++;
            else comment++;
            continue;
        }
        if (!line) {
            blank++;
            continue;
        }
        const block = syntax.block?.find(([open]) => line.startsWith(open));
        if (block) {
            const i = line.indexOf(block[1], block[0].length);
            if (i === -1) {
                closer = block[1];
                comment++;
            } else if (line.slice(i + block[1].length).trim()) {
                code++;
            } else {
                comment++;
            }
            continue;
        }
        if (syntax.line?.some((p) => line.startsWith(p))) {
            comment++;
            continue;
        }
        code++;
    }
    return { total: lines.length, code, comment, blank };
}

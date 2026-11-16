import { OTHER_NAME } from "./languages";
import { extKey } from "./path";
import type { FileStat, GroupBy, LangRow } from "./types";

export const groupKey = (f: FileStat, by: GroupBy) => (by === "extension" ? extKey(f.path) : f.lang);

export function summarize(stats: FileStat[], by: GroupBy = "language") {
    const map = new Map<string, LangRow>();
    const total: LangRow = { lang: "Total", iconLang: "Total", files: 0, code: 0, comment: 0, blank: 0, total: 0 };
    for (const s of stats) {
        const key = groupKey(s, by);
        const row = map.get(key) ?? {
            lang: key,
            iconLang: by === "extension" && s.lang === OTHER_NAME ? key : s.lang,
            files: 0,
            code: 0,
            comment: 0,
            blank: 0,
            total: 0,
        };
        for (const r of [row, total]) {
            r.files++;
            r.code += s.code;
            r.comment += s.comment;
            r.blank += s.blank;
            r.total += s.total;
        }
        map.set(key, row);
    }
    return { rows: [...map.values()].sort((a, b) => b.code - a.code), total };
}

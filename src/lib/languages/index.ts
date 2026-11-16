import { basename } from "../path";
import type { Syntax } from "../types";
import { LANGS } from "./data";
import { FILENAME_LANGS, findFilenameLang, findSpecial } from "./special-files";
import type { Language } from "./types";

export const OTHER_NAME = "Other";
const OTHER_SYNTAX: Syntax = {};

const BY_EXT = new Map<string, Language>();
const ICONS = new Map<string, string>();
for (const lang of LANGS) for (const ext of lang.exts) BY_EXT.set(ext, lang);
for (const lang of [...LANGS, ...Object.values(FILENAME_LANGS)]) if (lang.icon) ICONS.set(lang.name, lang.icon);

export function detect(path: string): [string, Syntax] {
    const lower = basename(path).toLowerCase();
    const dot = lower.lastIndexOf(".");

    const lang = (dot > 0 ? BY_EXT.get(lower.slice(dot + 1)) : undefined) ?? findFilenameLang(lower);
    if (lang) return [lang.name, lang.syntax];

    return [OTHER_NAME, findSpecial(lower)?.syntax ?? OTHER_SYNTAX];
}

export const iconSlug = (lang: string) => ICONS.get(lang) ?? findSpecial(lang.toLowerCase())?.icon;

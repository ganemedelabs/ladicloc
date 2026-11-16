import type { Syntax } from "../types";

export type Language = {
    name: string;
    /** File extensions (without the dot), matched case-insensitively. */
    exts: string[];
    syntax: Syntax;
    /** Simple Icons slug, @see {@link https://simpleicons.org|Simple Icons} */
    icon?: string;
};

/** A language matched by exact filename (`Dockerfile`) rather than extension. */
export type FilenameLang = Omit<Language, "exts">;

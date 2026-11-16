export const basename = (path: string) => path.slice(path.lastIndexOf("/") + 1);

/** `.ts` for `a/b.ts`; the whole name for dotfiles and extensionless files (`.gitignore`, `README`). */
export function extKey(path: string): string {
    const base = basename(path);
    if (/^\.env(\.|$)/i.test(base)) return ".env";
    const dot = base.lastIndexOf(".");
    return dot <= 0 ? base : `.${base.slice(dot + 1).toLowerCase()}`;
}

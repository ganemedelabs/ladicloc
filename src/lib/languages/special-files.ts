import type { Syntax } from "../types";
import { C, HASH } from "./syntax";
import type { FilenameLang } from "./types";

/** Files that count as a real language (own row in the table), matched by exact lowercase filename. */
export const FILENAME_LANGS: Record<string, FilenameLang> = {
    dockerfile: { name: "Dockerfile", syntax: HASH, icon: "docker" },
    makefile: { name: "Makefile", syntax: HASH, icon: "gnu" },
};

for (const hook of ["pre-commit", "pre-push", "commit-msg", "prepare-commit-msg", "post-merge", "post-checkout"]) {
    FILENAME_LANGS[hook] = { name: "Shell", syntax: HASH, icon: "gnubash" };
}

/** Files with no language of their own: they stay in "Other" but get comment syntax and an icon. */
export const SPECIAL_FILES = new Map<string, { syntax: Syntax; icon?: string }>();

const special = (names: string[], syntax: Syntax, icon?: string) => {
    for (const n of names) SPECIAL_FILES.set(n, { syntax, icon });
};

// Git / containers / hosting
special(
    [".gitignore", "gitignore", ".gitattributes", ".gitmodules", ".gitconfig", ".mailmap", ".git-blame-ignore-revs"],
    HASH,
    "git"
);
special([".gitkeep"], {}, "git");
special([".dockerignore"], HASH, "docker");
special([".vercelignore"], HASH, "vercel");

// JS tooling
special([".prettierrc", ".prettierignore"], HASH, "prettier");
special([".eslintrc", ".eslintignore"], C, "eslint");
special([".babelrc"], C, "babel");
special([".npmrc", ".npmignore"], { line: [";", "#"] }, "npm");
special([".yarnrc"], HASH, "yarn");
special([".nvmrc"], HASH, "nodedotjs");
special([".browserslistrc"], HASH, "browserslist");
special([".swcrc"], C, "swc");

// Editors / env
special([".editorconfig"], { line: ["#", ";"] }, "editorconfig");
special([".env"], HASH, "dotenv");

// Build / process files
special(["procfile"], HASH);
special(["justfile"], HASH, "just");
special(["jenkinsfile"], C, "jenkins");
special(["codeowners"], HASH, "github");

// Ruby
special(["gemfile", "rakefile", "podfile", "vagrantfile", "brewfile"], HASH, "ruby");

// Docs (no comment syntax)
special(["readme"], {}, "readme");
special(["license", "licence", "copying", "unlicense"], {}, "opensourceinitiative");
special(["changelog", "authors", "contributors", "notice"], {});

// Runtime version pins (replaces your .nvmrc line)
special([".nvmrc", ".node-version"], HASH, "nodedotjs");
special([".tool-versions"], HASH);

// Shell dotfiles, web server, Python and C++ tooling configs
special([".bashrc", ".zshrc", ".profile", ".bash_profile", ".zprofile"], HASH, "gnubash");
special([".htaccess"], HASH, "apache");
special([".flake8", ".pylintrc", ".coveragerc"], { line: ["#", ";"] }, "python");
special([".clang-format", ".clang-tidy"], HASH);

/** `Dockerfile.dev`, `Dockerfile.prod`, ... */
export const findFilenameLang = (lower: string) =>
    FILENAME_LANGS[lower] ?? (lower.startsWith("dockerfile.") ? FILENAME_LANGS.dockerfile : undefined);

/** Exact names first, then patterns: `.env.*`, `LICENSE-*`, and gitignore-style `.*ignore` files. */
export function findSpecial(lower: string): { syntax: Syntax; icon?: string } | undefined {
    const exact = SPECIAL_FILES.get(lower);
    if (exact) return exact;
    if (lower.startsWith(".env.")) return SPECIAL_FILES.get(".env");
    if (/^licen[cs]e[-_]/.test(lower)) return SPECIAL_FILES.get("license");
    if (lower.startsWith(".") && lower.endsWith("ignore")) return { syntax: HASH };
    return undefined;
}

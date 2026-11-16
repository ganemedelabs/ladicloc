export type Syntax = { line?: string[]; block?: [string, string][] };

export type FileStat = {
    path: string;
    lang: string;
    total: number;
    code: number;
    comment: number;
    blank: number;
};

export type GroupBy = "language" | "extension";

export type LangRow = {
    lang: string;
    iconLang: string;
    files: number;
    code: number;
    comment: number;
    blank: number;
    total: number;
};

export type TreeNode = { name: string; path: string; isFile: boolean; files: string[]; children: TreeNode[] };

export type RawFile = { path: string; data: Uint8Array };

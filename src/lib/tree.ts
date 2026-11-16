import type { TreeNode } from "./types";

export function buildTree(paths: string[]): TreeNode {
    const root: TreeNode = { name: "", path: "", isFile: false, files: [], children: [] };
    const index = new Map<string, TreeNode>([["", root]]);
    for (const p of paths) {
        const parts = p.split("/");
        let parent = root,
            cur = "";
        parts.forEach((part, i) => {
            cur = cur ? `${cur}/${part}` : part;
            let node = index.get(cur);
            if (!node) {
                node = { name: part, path: cur, isFile: i === parts.length - 1, files: [], children: [] };
                index.set(cur, node);
                parent.children.push(node);
            }
            node.files.push(p);
            parent = node;
        });
    }
    const sort = (n: TreeNode) => {
        n.children.sort((a, b) => Number(a.isFile) - Number(b.isFile) || a.name.localeCompare(b.name));
        n.children.forEach(sort);
    };
    sort(root);
    return root;
}

import { expect, test, describe } from "bun:test"; // Changed from vitest to bun:test since bun is the only runner
import { isValidShell, isSafePath } from "./security";

describe("isValidShell", () => {
    test("allows standard shells", () => {
        ['bash', 'zsh', 'powershell', 'pwsh', 'cmd', 'wsl'].forEach(s => expect(isValidShell(s)).toBe(true));
    });

    test("allows standard editors", () => {
        ['code', 'subl', 'atom', 'vim', 'nano'].forEach(e => expect(isValidShell(e)).toBe(true));
    });

    test("rejects unknown binaries", () => {
        ['rm', 'curl', 'python', 'node'].forEach(b => expect(isValidShell(b)).toBe(false));
    });
});

describe("isSafePath", () => {
    const base = "/app/repo";
    test("allows relative paths within base", () => {
        expect(isSafePath(base, "src/main.ts")).toBe(true);
    });
    test("rejects path traversal", () => {
        expect(isSafePath(base, "../../../etc/passwd")).toBe(false);
    });
    test("rejects absolute paths", () => {
        expect(isSafePath(base, "/etc/passwd")).toBe(false);
        expect(isSafePath(base, "C:\\Windows\\config")).toBe(false);
    });
});

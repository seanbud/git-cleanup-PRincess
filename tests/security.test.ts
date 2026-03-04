import { expect, test, describe } from "bun:test";
import path from "node:path";

/**
 * Note: These validation functions are duplicated from electron/main.ts
 * for testability since importing from the main process file is restricted
 * in a Node/Bun environment without a full Electron mock.
 */

function isSafePath(filePath: string, currentCwd: string): boolean {
    if (!filePath) return false;
    const resolvedPath = path.resolve(currentCwd, filePath);
    const relative = path.relative(currentCwd, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isValidSettingValue(value: any): boolean {
    if (typeof value !== 'string') return false;
    if (value.length > 255) return false;
    const forbidden = /[&|;<>$`]/;
    return !forbidden.test(value);
}

function isValidGitKey(key: string): boolean {
    if (typeof key !== 'string') return false;
    const validGitKey = /^[a-z0-9.-]+$/i;
    return validGitKey.test(key);
}

describe("Security Validations", () => {
    const mockCwd = "/Users/princess/repo";

    test("isSafePath", () => {
        expect(isSafePath("src/main.ts", mockCwd)).toBe(true);
        expect(isSafePath("index.html", mockCwd)).toBe(true);
        expect(isSafePath("../outside.txt", mockCwd)).toBe(false);
        expect(isSafePath("/etc/passwd", mockCwd)).toBe(false);
        expect(isSafePath("src/../../etc/passwd", mockCwd)).toBe(false);
        expect(isSafePath("", mockCwd)).toBe(false);
    });

    test("isValidSettingValue", () => {
        expect(isValidSettingValue("code")).toBe(true);
        expect(isValidSettingValue("bash")).toBe(true);
        expect(isValidSettingValue("powershell")).toBe(true);
        expect(isValidSettingValue("code; rm -rf /")).toBe(false);
        expect(isValidSettingValue("echo $HOME")).toBe(false);
        expect(isValidSettingValue("a".repeat(256))).toBe(false);
        expect(isValidSettingValue("")).toBe(true);
    });

    test("isValidGitKey", () => {
        expect(isValidGitKey("user.name")).toBe(true);
        expect(isValidGitKey("core.editor")).toBe(true);
        expect(isValidGitKey("user.email; rm -rf /")).toBe(false);
        expect(isValidGitKey("section.key$")).toBe(false);
        expect(isValidGitKey("")).toBe(false);
    });
});

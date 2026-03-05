import { expect, test, describe } from "vitest";
import path from "node:path";

// Duplicating the logic from electron/main.ts for unit testing
// since we cannot easily import from electron/main.ts in this environment.

const currentCwd = process.cwd();

function isSafePath(filePath: string): boolean {
    if (!filePath) return false;
    const resolvedPath = path.resolve(currentCwd, filePath);
    const relative = path.relative(currentCwd, resolvedPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isValidSettingValue(value: string): boolean {
    if (typeof value !== 'string') return false;
    if (value.length > 255) return false;
    const illegalChars = /[&|;<>$`]/;
    return !illegalChars.test(value);
}

function isValidGitKey(key: string): boolean {
    return /^[a-zA-Z0-9.-]+$/.test(key);
}

describe("Security Validation Helpers", () => {
    describe("isSafePath", () => {
        test("should allow relative paths inside the repo", () => {
            expect(isSafePath("package.json")).toBe(true);
            expect(isSafePath("src/App.tsx")).toBe(true);
            expect(isSafePath("./README.md")).toBe(true);
        });

        test("should block paths outside the repo", () => {
            expect(isSafePath("../package.json")).toBe(false);
            expect(isSafePath("../../etc/passwd")).toBe(false);
            // On Linux, /etc/passwd is absolute and might resolve outside /app
            expect(isSafePath("/etc/passwd")).toBe(false);
            // If we're on Windows, C:\Windows is absolute.
            // If we're on Linux, we should test an absolute Linux path.
            if (process.platform === 'win32') {
              expect(isSafePath("C:\\Windows\\System32")).toBe(false);
            } else {
              expect(isSafePath("/usr/bin/git")).toBe(false);
            }
        });

        test("should handle empty paths", () => {
            expect(isSafePath("")).toBe(false);
            // @ts-ignore
            expect(isSafePath(null)).toBe(false);
        });
    });

    describe("isValidSettingValue", () => {
        test("should allow alphanumeric values", () => {
            expect(isValidSettingValue("code")).toBe(true);
            expect(isValidSettingValue("bash")).toBe(true);
            expect(isValidSettingValue("subl")).toBe(true);
        });

        test("should block shell metacharacters", () => {
            expect(isValidSettingValue("code; rm -rf /")).toBe(false);
            expect(isValidSettingValue("bash & echo 'hacked'")).toBe(false);
            expect(isValidSettingValue("subl | cat /etc/passwd")).toBe(false);
            expect(isValidSettingValue("`id`")).toBe(false);
            expect(isValidSettingValue("$HOME")).toBe(false);
            expect(isValidSettingValue("ls > test.txt")).toBe(false);
        });

        test("should block overly long values", () => {
            expect(isValidSettingValue("a".repeat(256))).toBe(false);
        });
    });

    describe("isValidGitKey", () => {
        test("should allow valid git config keys", () => {
            expect(isValidGitKey("user.name")).toBe(true);
            expect(isValidGitKey("core.autocrlf")).toBe(true);
            expect(isValidGitKey("init.defaultBranch")).toBe(true);
        });

        test("should block invalid characters", () => {
            expect(isValidGitKey("user.name;")).toBe(false);
            expect(isValidGitKey("user name")).toBe(false);
            expect(isValidGitKey("core.editor&")).toBe(false);
        });
    });
});

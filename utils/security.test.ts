import { expect, test, describe } from "vitest";
import { isSafePath, isValidShell, isValidEditor } from "./security";

describe("Security Utilities", () => {
    const baseDir = "/home/user/repo";

    describe("isSafePath", () => {
        test("should allow paths inside the base directory", () => {
            expect(isSafePath(baseDir, "src/index.ts")).toBe(true);
            expect(isSafePath(baseDir, "/home/user/repo/src/index.ts")).toBe(true);
        });

        test("should block paths outside the base directory", () => {
            expect(isSafePath(baseDir, "../outside.ts")).toBe(false);
            expect(isSafePath(baseDir, "/etc/passwd")).toBe(false);
            expect(isSafePath(baseDir, "../../etc/passwd")).toBe(false);
        });

        test("should handle tricky relative paths", () => {
            expect(isSafePath(baseDir, "src/../src/index.ts")).toBe(true);
            expect(isSafePath(baseDir, "src/../../outside.ts")).toBe(false);
        });
    });

    describe("isValidShell", () => {
        test("should allow common shells", () => {
            expect(isValidShell("bash")).toBe(true);
            expect(isValidShell("zsh")).toBe(true);
            expect(isValidShell("powershell.exe")).toBe(true);
            expect(isValidShell("/usr/bin/bash")).toBe(true);
            expect(isValidShell("C:\\Windows\\System32\\cmd.exe")).toBe(true);
        });

        test("should block uncommon or dangerous binaries", () => {
            expect(isValidShell("python")).toBe(false);
            expect(isValidShell("curl")).toBe(false);
            expect(isValidShell("rm")).toBe(false);
            expect(isValidShell("")).toBe(false);
        });
    });

    describe("isValidEditor", () => {
        test("should allow common editors", () => {
            expect(isValidEditor("code")).toBe(true);
            expect(isValidEditor("vim")).toBe(true);
            expect(isValidEditor("notepad.exe")).toBe(true);
            expect(isValidEditor("/usr/local/bin/subl")).toBe(true);
        });

        test("should block non-editor binaries", () => {
            expect(isValidEditor("git")).toBe(false);
            expect(isValidEditor("npm")).toBe(false);
            expect(isValidEditor("ls")).toBe(false);
        });
    });
});

import { expect, test, describe } from "bun:test";
import { isSafePath, isValidGitKey, isValidSettingValue } from "../electron/security.ts";

// Mocking the environment for security helpers
const currentCwd = process.cwd();

describe("Security Helpers", () => {
    describe("isSafePath", () => {
        test("should allow relative paths inside cwd", () => {
            expect(isSafePath("src/index.ts", currentCwd)).toBe(true);
            expect(isSafePath("./README.md", currentCwd)).toBe(true);
            expect(isSafePath("package.json", currentCwd)).toBe(true);
        });

        test("should block path traversal", () => {
            expect(isSafePath("../../../etc/passwd", currentCwd)).toBe(false);
            // src/../.. escapes currentCwd, so it should be false
            expect(isSafePath("src/../../package.json", currentCwd)).toBe(false);
            expect(isSafePath("../../external", currentCwd)).toBe(false);
        });

        test("should block absolute paths", () => {
            expect(isSafePath("/etc/passwd", currentCwd)).toBe(false);
            // On Linux it's relative but we should be careful
            expect(isSafePath("/var/log/syslog", currentCwd)).toBe(false);
        });
    });

    describe("isValidGitKey", () => {
        test("should allow valid git config keys", () => {
            expect(isValidGitKey("user.name")).toBe(true);
            expect(isValidGitKey("core.autocrlf")).toBe(true);
            expect(isValidGitKey("remote.origin.url")).toBe(true);
        });

        test("should block keys with special characters", () => {
            expect(isValidGitKey("user.name; drop table users")).toBe(false);
            expect(isValidGitKey("core.editor|calc")).toBe(false);
            expect(isValidGitKey("git config --global user.name")).toBe(false);
        });
    });

    describe("isValidSettingValue", () => {
        test("should allow safe setting values", () => {
            expect(isValidSettingValue("code")).toBe(true);
            expect(isValidSettingValue("bash")).toBe(true);
            expect(isValidSettingValue("powershell.exe")).toBe(true);
            expect(isValidSettingValue("/usr/bin/vim")).toBe(true);
        });

        test("should block shell metacharacters", () => {
            expect(isValidSettingValue("code; rm -rf /")).toBe(false);
            expect(isValidSettingValue("bash && echo 'pwned'")).toBe(false);
            expect(isValidSettingValue("editor | nc -e /bin/sh")).toBe(false);
            expect(isValidSettingValue("$(whoami)")).toBe(false);
            expect(isValidSettingValue("`id`")).toBe(false);
        });

        test("should block overly long values", () => {
            expect(isValidSettingValue("a".repeat(256))).toBe(false);
        });
    });
});

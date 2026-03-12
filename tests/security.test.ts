import { expect, test, describe } from "bun:test";
import { isSafePath, isValidShell, isValidSettingValue } from "../utils/security";

const currentCwd = process.cwd();

describe("Security Helpers", () => {
  describe("isSafePath", () => {
    test("should allow relative paths within CWD", () => {
      expect(isSafePath("src/index.ts", currentCwd)).toBe(true);
      expect(isSafePath("package.json", currentCwd)).toBe(true);
    });

    test("should block paths outside CWD using ..", () => {
      expect(isSafePath("../outside.txt", currentCwd)).toBe(false);
      expect(isSafePath("src/../../outside.txt", currentCwd)).toBe(false);
    });

    test("should block absolute paths", () => {
      expect(isSafePath("/etc/passwd", currentCwd)).toBe(false);
    });
  });

  describe("isValidShell", () => {
    test("should allow valid shells", () => {
      expect(isValidShell("bash")).toBe(true);
      expect(isValidShell("powershell")).toBe(true);
      expect(isValidShell("zsh")).toBe(true);
    });

    test("should block invalid shells", () => {
      expect(isValidShell("rm -rf /")).toBe(false);
      expect(isValidShell("node")).toBe(false);
    });
  });

  describe("isValidSettingValue", () => {
    test("should allow safe setting values", () => {
      expect(isValidSettingValue("code")).toBe(true);
      expect(isValidSettingValue("subl --wait")).toBe(true);
      expect(isValidSettingValue("C:\\Program Files\\Editor.exe")).toBe(true);
    });

    test("should allow quotes in paths", () => {
      expect(isValidSettingValue('"C:\\Path With Spaces\\editor.exe"')).toBe(true);
      expect(isValidSettingValue("'C:\\Path With Spaces\\editor.exe'")).toBe(true);
    });

    test("should block values with dangerous characters", () => {
      expect(isValidSettingValue("code; rm -rf /")).toBe(false);
      expect(isValidSettingValue("editor & echo vulnerable")).toBe(false);
    });

    test("should block redirection and pipes", () => {
        expect(isValidSettingValue("editor |")).toBe(false);
        expect(isValidSettingValue("editor >")).toBe(false);
    });

    test("should block overly long values", () => {
      expect(isValidSettingValue("a".repeat(256))).toBe(false);
    });
  });
});

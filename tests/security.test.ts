import { expect, test, describe } from "bun:test";

/**
 * Note: These helper functions are duplicated from electron/main.ts for unit testing
 * because Electron-specific module dependencies make importing directly from main.ts
 * in a non-Electron environment (like bun test) difficult.
 */
function isValidShell(shell: string): boolean {
    const allowed = ['bash', 'zsh', 'sh', 'fish', 'powershell', 'pwsh', 'cmd'];
    return allowed.includes(shell.toLowerCase());
}

function isValidSettingValue(val: any): boolean {
    return typeof val === 'string' && val.length < 255 && /^[a-zA-Z0-9._\-\/\\ :~()@+]*$/.test(val);
}

describe("Security Validation Helpers", () => {
    test("isValidShell should allow permit shells", () => {
        expect(isValidShell("bash")).toBe(true);
        expect(isValidShell("zsh")).toBe(true);
        expect(isValidShell("powershell")).toBe(true);
        expect(isValidShell("CMD")).toBe(true);
    });

    test("isValidShell should deny unknown shells", () => {
        expect(isValidShell("rm -rf /")).toBe(false);
        expect(isValidShell("curl")).toBe(false);
        expect(isValidShell("python3")).toBe(false);
    });

    test("isValidSettingValue should allow safe strings", () => {
        expect(isValidSettingValue("code")).toBe(true);
        expect(isValidSettingValue("cursor")).toBe(true);
        expect(isValidSettingValue("subl")).toBe(true);
        expect(isValidSettingValue("C:\\Program Files\\VSCode\\bin\\code.exe")).toBe(true);
        expect(isValidSettingValue("~/bin/cursor")).toBe(true);
        expect(isValidSettingValue("C:\\Program Files (x86)\\VSCode\\code.exe")).toBe(true);
        expect(isValidSettingValue("editor@v1.0.0")).toBe(true);
        expect(isValidSettingValue("path+with+plus")).toBe(true);
    });

    test("isValidSettingValue should deny dangerous or overly long strings", () => {
        expect(isValidSettingValue("code; rm -rf /")).toBe(false);
        expect(isValidSettingValue("a".repeat(300))).toBe(false);
        expect(isValidSettingValue(null)).toBe(false);
    });
});

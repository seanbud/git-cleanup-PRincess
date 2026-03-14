import { expect, test, describe } from "bun:test";
import { isSafePath } from "../utils/security";

describe("Security Utils", () => {
    describe("isSafePath", () => {
        const baseDir = "/home/user/project";

        test("allows relative path inside base", () => {
            expect(isSafePath(baseDir, "src/index.ts")).toBe(true);
        });

        test("allows simple file name", () => {
            expect(isSafePath(baseDir, "README.md")).toBe(true);
        });

        test("blocks path traversal with ..", () => {
            expect(isSafePath(baseDir, "../outside.txt")).toBe(false);
            expect(isSafePath(baseDir, "src/../../outside.txt")).toBe(false);
        });

        test("blocks absolute paths", () => {
            expect(isSafePath(baseDir, "/etc/passwd")).toBe(false);
        });
    });
});

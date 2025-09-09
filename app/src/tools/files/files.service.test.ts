import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { filesService } from "./files.service";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";

describe("filesService", () => {
  const testDir = "/tmp/test-files-service";

  beforeAll(async () => {
    // Create test directory structure
    await mkdir(join(testDir, "subdir1"), { recursive: true });
    await mkdir(join(testDir, "subdir2", "nested"), { recursive: true });

    // Create test files
    await writeFile(join(testDir, "file1.txt"), "content1");
    await writeFile(join(testDir, "file2.js"), "console.log('test')");
    await writeFile(join(testDir, "subdir1", "file3.ts"), "export {}");
    await writeFile(join(testDir, "subdir2", "file4.md"), "# Test");
    await writeFile(join(testDir, "subdir2", "nested", "file5.json"), "{}");
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  test("getAllFiles returns all files in directory recursively", async () => {
    const files = await filesService.getAllFiles(testDir);

    expect(files).toBeArray();
    expect(files.length).toBe(5);

    // Check that all expected files are present
    expect(files).toContain(`${testDir}/file1.txt`);
    expect(files).toContain(`${testDir}/file2.js`);
    expect(files).toContain(`${testDir}/subdir1/file3.ts`);
    expect(files).toContain(`${testDir}/subdir2/file4.md`);
    expect(files).toContain(`${testDir}/subdir2/nested/file5.json`);
  });

  test("getAllFiles returns empty array for non-existent directory", async () => {
    const files = await filesService.getAllFiles("/non/existent/directory");

    expect(files).toBeArray();
    expect(files.length).toBe(0);
  });

  test("getAllFiles returns empty array for empty directory", async () => {
    const emptyDir = "/tmp/empty-test-dir";
    await mkdir(emptyDir, { recursive: true });

    const files = await filesService.getAllFiles(emptyDir);

    expect(files).toBeArray();
    expect(files.length).toBe(0);

    await rm(emptyDir, { recursive: true, force: true });
  });

  test("getAllFiles only returns files, not directories", async () => {
    const files = await filesService.getAllFiles(testDir);

    // Should not contain directory paths
    expect(files).not.toContain(`${testDir}/subdir1`);
    expect(files).not.toContain(`${testDir}/subdir2`);
    expect(files).not.toContain(`${testDir}/subdir2/nested`);
  });
});
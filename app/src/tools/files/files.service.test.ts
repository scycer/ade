import { test, expect, describe, beforeAll, afterAll, beforeEach } from "bun:test";
import { filesService } from "./files.service";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

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

  describe("getAllFiles", () => {
    test("returns all files in directory recursively", async () => {
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

    test("returns empty array for non-existent directory", async () => {
      const files = await filesService.getAllFiles("/non/existent/directory");

      expect(files).toBeArray();
      expect(files.length).toBe(0);
    });

    test("returns empty array for empty directory", async () => {
      const emptyDir = "/tmp/empty-test-dir";
      await mkdir(emptyDir, { recursive: true });

      const files = await filesService.getAllFiles(emptyDir);

      expect(files).toBeArray();
      expect(files.length).toBe(0);

      await rm(emptyDir, { recursive: true, force: true });
    });

    test("only returns files, not directories", async () => {
      const files = await filesService.getAllFiles(testDir);

      // Should not contain directory paths
      expect(files).not.toContain(`${testDir}/subdir1`);
      expect(files).not.toContain(`${testDir}/subdir2`);
      expect(files).not.toContain(`${testDir}/subdir2/nested`);
    });
  });

  describe("getFile", () => {
    test("reads file content successfully", async () => {
      const content = await filesService.getFile(join(testDir, "file1.txt"));
      expect(content).toBe("content1");
    });

    test("returns null for non-existent file", async () => {
      const content = await filesService.getFile("/non/existent/file.txt");
      expect(content).toBeNull();
    });

    test("reads file with special characters", async () => {
      const specialFile = join(testDir, "special.txt");
      const specialContent = "Line 1\nLine 2\t\tTabbed\n🚀 Emoji\n";
      await writeFile(specialFile, specialContent);

      const content = await filesService.getFile(specialFile);
      expect(content).toBe(specialContent);

      await rm(specialFile);
    });
  });

  describe("newFile", () => {
    test("creates new file successfully", async () => {
      const newFilePath = join(testDir, "new-file.txt");
      const result = await filesService.newFile(newFilePath, "new content");

      expect(result).toBe(true);
      expect(existsSync(newFilePath)).toBe(true);

      const content = await filesService.getFile(newFilePath);
      expect(content).toBe("new content");

      await rm(newFilePath);
    });

    test("returns false when file already exists", async () => {
      const existingFile = join(testDir, "file1.txt");
      const result = await filesService.newFile(existingFile, "should fail");

      expect(result).toBe(false);
      // Original content should remain unchanged
      const content = await filesService.getFile(existingFile);
      expect(content).toBe("content1");
    });

    test("creates file with empty content", async () => {
      const emptyFile = join(testDir, "empty.txt");
      const result = await filesService.newFile(emptyFile, "");

      expect(result).toBe(true);
      const content = await filesService.getFile(emptyFile);
      expect(content).toBe("");

      await rm(emptyFile);
    });
  });

  describe("updateFile", () => {
    test("updates existing file successfully", async () => {
      const updatePath = join(testDir, "update-test.txt");
      await writeFile(updatePath, "original content");

      const result = await filesService.updateFile(updatePath, "updated content");

      expect(result).toBe(true);
      const content = await filesService.getFile(updatePath);
      expect(content).toBe("updated content");

      await rm(updatePath);
    });

    test("returns false when file doesn't exist", async () => {
      const result = await filesService.updateFile("/non/existent.txt", "content");
      expect(result).toBe(false);
    });

    test("can update file to empty content", async () => {
      const filePath = join(testDir, "clear-test.txt");
      await writeFile(filePath, "some content");

      const result = await filesService.updateFile(filePath, "");
      expect(result).toBe(true);

      const content = await filesService.getFile(filePath);
      expect(content).toBe("");

      await rm(filePath);
    });
  });

  describe("deleteFile", () => {
    test("deletes existing file successfully", async () => {
      const deletePath = join(testDir, "delete-me.txt");
      await writeFile(deletePath, "delete this");

      const result = await filesService.deleteFile(deletePath);

      expect(result).toBe(true);
      expect(existsSync(deletePath)).toBe(false);
    });

    test("returns false when file doesn't exist", async () => {
      const result = await filesService.deleteFile("/non/existent.txt");
      expect(result).toBe(false);
    });
  });

  describe("fileExists", () => {
    test("returns true for existing file", () => {
      const result = filesService.fileExists(join(testDir, "file1.txt"));
      expect(result).toBe(true);
    });

    test("returns false for non-existent file", () => {
      const result = filesService.fileExists("/non/existent.txt");
      expect(result).toBe(false);
    });

    test("returns true for directories", () => {
      const result = filesService.fileExists(testDir);
      expect(result).toBe(true);
    });
  });

  describe("getFileInfo", () => {
    test("returns file info for existing file", async () => {
      const filePath = join(testDir, "file1.txt");
      const info = await filesService.getFileInfo(filePath);

      expect(info).not.toBeNull();
      expect(info?.isFile).toBe(true);
      expect(info?.isDirectory).toBe(false);
      expect(info?.size).toBe(8); // "content1" is 8 bytes
      expect(info?.modifiedTime).toBeInstanceOf(Date);
      expect(info?.createdTime).toBeInstanceOf(Date);
    });

    test("returns directory info for directory", async () => {
      const info = await filesService.getFileInfo(testDir);

      expect(info).not.toBeNull();
      expect(info?.isFile).toBe(false);
      expect(info?.isDirectory).toBe(true);
      expect(info?.modifiedTime).toBeInstanceOf(Date);
    });

    test("returns null for non-existent path", async () => {
      const info = await filesService.getFileInfo("/non/existent.txt");
      expect(info).toBeNull();
    });

    test("returns correct size for different files", async () => {
      const testFile = join(testDir, "size-test.txt");
      const testContent = "12345"; // 5 bytes
      await writeFile(testFile, testContent);

      const info = await filesService.getFileInfo(testFile);
      expect(info?.size).toBe(5);

      await rm(testFile);
    });
  });
});
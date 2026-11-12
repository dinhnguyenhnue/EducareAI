import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inspectZipBuffer,
  sanitizeDisplayFileName,
  validateUploadedAsset,
} from "../src/lib/asset-validation";

function createMockZipLocalHeader(params: {
  entryName: string;
  compressedSize: number;
  uncompressedSize: number;
  payload?: Buffer;
}): Buffer {
  const nameBuf = Buffer.from(params.entryName, "utf8");
  const payload = params.payload || Buffer.alloc(params.compressedSize, 0x41);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0, 6); // flags
  header.writeUInt16LE(0, 8); // compression method (store)
  header.writeUInt16LE(0, 10); // mod time
  header.writeUInt16LE(0, 12); // mod date
  header.writeUInt32LE(0, 14); // crc32
  header.writeUInt32LE(params.compressedSize, 18);
  header.writeUInt32LE(params.uncompressedSize, 22);
  header.writeUInt16LE(nameBuf.length, 26);
  header.writeUInt16LE(0, 28); // extra field length
  return Buffer.concat([header, nameBuf, payload]);
}

describe("Asset Validation & ZIP Security (Section 4)", () => {
  it("accepts valid PDF with %PDF- signature and assigns random storageKey", () => {
    const pdfBuffer = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n", "utf8");
    const res = validateUploadedAsset({
      fileName: "../../Bai_Giang_Tin_7<script>.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });
    assert.equal(res.ok, true);
    assert.equal(res.code, "OK");
    assert.equal(res.metadata?.safeFileName, "Bai_Giang_Tin_7_script_.pdf");
    assert.equal(res.metadata?.previewMode, "INLINE_PREVIEW");
    assert.match(res.metadata?.storageKey || "", /^assets\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.pdf$/);
  });

  it("rejects spoofed executable renamed to .pdf (signature mismatch)", () => {
    // Windows PE executable header "MZ"
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    const res = validateUploadedAsset({
      fileName: "tai-lieu.pdf",
      mimeType: "application/pdf",
      buffer: exeBuffer,
    });
    assert.equal(res.ok, false);
    assert.equal(res.code, "SIGNATURE_MISMATCH");
  });

  it("rejects forbidden executable extensions (.exe, .bat, .ps1, .js)", () => {
    for (const ext of [".exe", ".bat", ".ps1", ".js"]) {
      const res = validateUploadedAsset({
        fileName: `script${ext}`,
        mimeType: "application/octet-stream",
        buffer: Buffer.from("echo hello", "utf8"),
      });
      assert.equal(res.ok, false);
      assert.equal(res.code, "DISALLOWED_EXTENSION");
    }
  });

  it("rejects Zip Slip path traversal (../) inside ZIP archive", () => {
    const zipSlipBuf = createMockZipLocalHeader({
      entryName: "../../etc/passwd",
      compressedSize: 12,
      uncompressedSize: 12,
    });
    const check = inspectZipBuffer(zipSlipBuf);
    assert.equal(check.ok, false);
    assert.equal(check.code, "ZIP_PATH_TRAVERSAL");

    const uploadRes = validateUploadedAsset({
      fileName: "bai-nop.zip",
      mimeType: "application/zip",
      buffer: zipSlipBuf,
    });
    assert.equal(uploadRes.ok, false);
    assert.equal(uploadRes.code, "ZIP_PATH_TRAVERSAL");
  });

  it("rejects embedded executable (.exe) inside ZIP archive", () => {
    const zipWithExe = createMockZipLocalHeader({
      entryName: "subfolder/trojan.exe",
      compressedSize: 16,
      uncompressedSize: 16,
    });
    const uploadRes = validateUploadedAsset({
      fileName: "san-pham.zip",
      mimeType: "application/zip",
      buffer: zipWithExe,
    });
    assert.equal(uploadRes.ok, false);
    assert.equal(uploadRes.code, "ZIP_FORBIDDEN_ENTRY");
  });

  it("rejects Zip Bomb when uncompressed size exceeds 100MB", () => {
    const zipBombBuf = createMockZipLocalHeader({
      entryName: "bomb.txt",
      compressedSize: 32,
      uncompressedSize: 150 * 1024 * 1024, // 150 MB
      payload: Buffer.alloc(32, 0),
    });
    const uploadRes = validateUploadedAsset({
      fileName: "bomb.zip",
      mimeType: "application/zip",
      buffer: zipBombBuf,
    });
    assert.equal(uploadRes.ok, false);
    assert.equal(uploadRes.code, "ZIP_BOMB_DETECTED");
  });

  it("accepts clean ZIP archive and classifies as DOWNLOAD_ONLY", () => {
    const cleanZip = createMockZipLocalHeader({
      entryName: "bai-tap/bao-cao.txt",
      compressedSize: 10,
      uncompressedSize: 10,
    });
    const uploadRes = validateUploadedAsset({
      fileName: "nop-bai.zip",
      mimeType: "application/zip",
      buffer: cleanZip,
    });
    assert.equal(uploadRes.ok, true);
    assert.equal(uploadRes.metadata?.previewMode, "DOWNLOAD_ONLY");
    assert.equal(uploadRes.metadata?.zipSummary?.entryCount, 1);
  });

  it("sanitizes dangerous characters in display filenames", () => {
    assert.equal(
      sanitizeDisplayFileName("C:\\fakepath\\..\\bai<tap>|?.docx"),
      "bai_tap___.docx"
    );
  });
});

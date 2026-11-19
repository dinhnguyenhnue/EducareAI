import zlib from "zlib";

export interface ParsedStudentRow {
  rowNumber: number;
  sheetName: string;
  studentCode: string;
  codeGenerated?: boolean;
  fullName: string;
  className: string;
  gradeLevel: number;
  dateOfBirth: string | null;
  gender: string | null;
  emailFromFile: string | null; // null if file does not have student email
  isValid: boolean;
  errors: string[];
}

export interface ExcelParseResult {
  fileName: string;
  sheetsDetected: string[];
  skippedNonTargetSheets?: string[];
  skippedNonTargetCount?: number;
  columnsDetected: string[];
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  gradeBreakdown: {
    grade6: number;
    grade7: number;
    grade8: number;
  };
  classBreakdown?: Record<string, number>;
}

/**
 * Extracts files from a standard ZIP buffer (such as an OpenXML .xlsx file)
 * using Node.js built-in zlib.inflateRawSync.
 * Reads the Central Directory so entries using Data Descriptors (compressedSize=0 in local header)
 * exported by Microsoft Excel or Google Sheets are extracted reliably.
 */
export function unzipBuffer(zipBuffer: Buffer): Record<string, Buffer> {
  const files: Record<string, Buffer> = {};

  // Locate End of Central Directory (0x06054b50) from the end of the buffer
  let eocdOffset = -1;
  const minOffset = Math.max(0, zipBuffer.length - 65557);
  for (let pos = zipBuffer.length - 22; pos >= minOffset; pos--) {
    if (zipBuffer.readUInt32LE(pos) === 0x06054b50) {
      eocdOffset = pos;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const centralDirSize = zipBuffer.readUInt32LE(eocdOffset + 12);
    const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
    let cdPos = centralDirOffset;
    const cdEnd = centralDirOffset + centralDirSize;

    while (cdPos + 46 <= cdEnd && cdPos + 46 <= zipBuffer.length) {
      if (zipBuffer.readUInt32LE(cdPos) !== 0x02014b50) break;

      const compressionMethod = zipBuffer.readUInt16LE(cdPos + 10);
      const compressedSize = zipBuffer.readUInt32LE(cdPos + 20);
      const fileNameLength = zipBuffer.readUInt16LE(cdPos + 28);
      const extraFieldLength = zipBuffer.readUInt16LE(cdPos + 30);
      const commentLength = zipBuffer.readUInt16LE(cdPos + 32);
      const localHeaderOffset = zipBuffer.readUInt32LE(cdPos + 42);

      const fileName = zipBuffer
        .subarray(cdPos + 46, cdPos + 46 + fileNameLength)
        .toString("utf-8");

      if (
        localHeaderOffset + 30 <= zipBuffer.length &&
        zipBuffer.readUInt32LE(localHeaderOffset) === 0x04034b50
      ) {
        const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
        const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const compressedData = zipBuffer.subarray(
          dataStart,
          dataStart + compressedSize
        );

        if (compressionMethod === 0) {
          files[fileName] = Buffer.from(compressedData);
        } else if (compressionMethod === 8) {
          files[fileName] = zlib.inflateRawSync(compressedData);
        }
      }

      cdPos += 46 + fileNameLength + extraFieldLength + commentLength;
    }

    return files;
  }

  // Fallback: sequential local file header scan
  let offset = 0;
  while (offset + 30 <= zipBuffer.length) {
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;

    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);

    const fileNameStart = offset + 30;
    const fileName = zipBuffer
      .subarray(fileNameStart, fileNameStart + fileNameLength)
      .toString("utf-8");

    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    const compressedData = zipBuffer.subarray(
      dataStart,
      dataStart + compressedSize
    );

    if (compressionMethod === 0) {
      files[fileName] = Buffer.from(compressedData);
    } else if (compressionMethod === 8) {
      files[fileName] = zlib.inflateRawSync(compressedData);
    }

    offset = dataStart + compressedSize;
  }

  return files;
}

/**
 * Creates a valid uncompressed ZIP buffer from a map of file paths -> Buffer/string
 * for generating standard OpenXML .xlsx workbooks.
 */
export function createZipBuffer(entries: Record<string, string | Buffer>): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let currentOffset = 0;

  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  for (const [name, content] of Object.entries(entries)) {
    const dataBuf =
      typeof content === "string" ? Buffer.from(content, "utf-8") : content;
    const nameBuf = Buffer.from(name, "utf-8");
    const crc = crc32(dataBuf);

    // Local file header (30 bytes + name)
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // store (uncompressed)
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dataBuf.length, 18);
    local.writeUInt32LE(dataBuf.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    localHeaders.push(local, dataBuf);

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(dataBuf.length, 20);
    central.writeUInt32LE(dataBuf.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(currentOffset, 42);
    nameBuf.copy(central, 46);

    centralHeaders.push(central);
    currentOffset += local.length + dataBuf.length;
  }

  const centralDirBuffer = Buffer.concat(centralHeaders);
  const eocd = Buffer.alloc(22);
  const count = Object.keys(entries).length;
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(count, 8);
  eocd.writeUInt16LE(count, 10);
  eocd.writeUInt32LE(centralDirBuffer.length, 12);
  eocd.writeUInt32LE(currentOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, centralDirBuffer, eocd]);
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function colLettersToIndex(letters: string): number {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
}

/**
 * Parses an OpenXML .xlsx file buffer into sheets and rows.
 */
export function parseXlsxRawSheets(
  buffer: Buffer
): Array<{ sheetName: string; rows: string[][] }> {
  const entries = unzipBuffer(buffer);

  // 1. Parse sharedStrings.xml if present
  const sharedStrings: string[] = [];
  const sharedStringsXml = entries["xl/sharedStrings.xml"]?.toString("utf-8");
  if (sharedStringsXml) {
    const siMatches = sharedStringsXml.match(/<si[\s\S]*?<\/si>/g) || [];
    for (const si of siMatches) {
      const tMatches = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
      const combined = tMatches
        .map((t) => decodeXmlEntities(t.replace(/<\/?t[^>]*>/g, "")))
        .join("");
      sharedStrings.push(combined);
    }
  }

  // 2. Parse workbook.xml & workbook.xml.rels for exact sheetName -> worksheet path mapping
  const relsXml = entries["xl/_rels/workbook.xml.rels"]?.toString("utf-8") || "";
  const relIdToTarget: Record<string, string> = {};
  const relMatches = relsXml.match(/<Relationship\s+[^>]*\/?>/g) || [];
  for (const relTag of relMatches) {
    const idMatch = relTag.match(/Id="([^"]+)"/);
    const targetMatch = relTag.match(/Target="([^"]+)"/);
    if (idMatch && targetMatch) {
      let target = targetMatch[1].replace(/^\/+/, "");
      if (!target.startsWith("xl/")) {
        target = `xl/${target}`;
      }
      relIdToTarget[idMatch[1]] = target;
    }
  }

  const orderedSheets: Array<{ sheetName: string; entryKey: string }> = [];
  const workbookXml = entries["xl/workbook.xml"]?.toString("utf-8") || "";
  const sheetTagMatches = workbookXml.match(/<sheet\s+[^>]*\/?>/g) || [];
  sheetTagMatches.forEach((tag, idx) => {
    const nameMatch = tag.match(/name="([^"]+)"/);
    const rIdMatch = tag.match(/r:id="([^"]+)"/);
    const sheetName = nameMatch ? decodeXmlEntities(nameMatch[1]) : `Sheet${idx + 1}`;
    const mappedKey = rIdMatch ? relIdToTarget[rIdMatch[1]] : undefined;
    const fallbackKey = `xl/worksheets/sheet${idx + 1}.xml`;
    orderedSheets.push({
      sheetName,
      entryKey: mappedKey && entries[mappedKey] ? mappedKey : fallbackKey,
    });
  });

  // Fallback if workbook.xml had no <sheet> tags
  if (orderedSheets.length === 0) {
    Object.keys(entries)
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/sheet(\d+)\.xml/)?.[1] || "1", 10);
        const numB = parseInt(b.match(/sheet(\d+)\.xml/)?.[1] || "1", 10);
        return numA - numB;
      })
      .forEach((key, idx) => {
        orderedSheets.push({ sheetName: `Sheet${idx + 1}`, entryKey: key });
      });
  }

  const result: Array<{ sheetName: string; rows: string[][] }> = [];

  orderedSheets.forEach(({ sheetName, entryKey }) => {
    if (!entries[entryKey]) return;
    const xml = entries[entryKey].toString("utf-8");
    const rowMatches = xml.match(/<row[\s\S]*?<\/row>/g) || [];
    const rows: string[][] = [];

    for (const rowXml of rowMatches) {
      const cellMatches = rowXml.match(/<c\s+[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || [];
      const rowCells: string[] = [];

      for (const cellXml of cellMatches) {
        const refMatch = cellXml.match(/r="([A-Z]+)\d+"/);
        const colIdx = refMatch ? colLettersToIndex(refMatch[1]) : rowCells.length;
        const typeMatch = cellXml.match(/t="([^"]+)"/);
        const cellType = typeMatch ? typeMatch[1] : "";

        let val = "";
        if (cellType === "inlineStr") {
          const tMatch = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/);
          val = tMatch ? decodeXmlEntities(tMatch[1]) : "";
        } else {
          const vMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
          const rawV = vMatch ? vMatch[1].trim() : "";
          if (cellType === "s") {
            const sIdx = parseInt(rawV, 10);
            val = sharedStrings[sIdx] ?? rawV;
          } else if (cellType === "str" || cellType === "e") {
            val = decodeXmlEntities(rawV);
          } else {
            val = decodeXmlEntities(rawV);
          }
        }

        while (rowCells.length <= colIdx) {
          rowCells.push("");
        }
        rowCells[colIdx] = val.trim();
      }

      if (rowCells.some((c) => c !== "")) {
        rows.push(rowCells);
      }
    }

    result.push({ sheetName, rows });
  });

  return result;
}

const TARGET_PILOT_GRADES = new Set([6, 7, 8]);

/**
 * Normalizes Excel date serial numbers or ISO timestamps into DD/MM/YYYY.
 */
function normalizeDateValue(rawVal: string | undefined | null): string | null {
  if (!rawVal) return null;
  const cleaned = rawVal.trim().replace(/^'+|'+$/g, "");
  if (!cleaned) return null;

  // ISO timestamp e.g. "2015-03-07 00:00:00"
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
  }

  // Excel serial number (e.g. 42000 -> ~2015)
  if (/^\d{5}(\.0+)?$/.test(cleaned)) {
    const serial = parseInt(cleaned, 10);
    if (serial > 30000 && serial < 60000) {
      const utcDays = serial - 25569;
      const d = new Date(utcDays * 86400 * 1000);
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const yyyy = d.getUTCFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  return cleaned;
}

/**
 * Normalizes student code so re-imports are idempotent and clean.
 */
export function normalizeStudentCode(
  rawCode: string,
  gradeLevel: number,
  seqIndex: number,
  className?: string
): string {
  const cleaned = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (cleaned.length >= 3) {
    return cleaned;
  }
  const cleanClass = (className || `${gradeLevel}A1`)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  return `HS26-${cleanClass}-${String(seqIndex).padStart(2, "0")}`;
}

export function detectGradeLevel(
  sheetName: string,
  className: string,
  explicitGrade: string
): number | null {
  const gNum = parseInt(explicitGrade, 10);
  if (gNum >= 1 && gNum <= 12) return gNum;

  const classMatch = className.trim().match(/^(\d{1,2})/);
  if (classMatch) {
    const cGrade = parseInt(classMatch[1], 10);
    if (cGrade >= 1 && cGrade <= 12) return cGrade;
  }

  const sheetTrimmed = sheetName.trim();
  const sheetClassMatch = sheetTrimmed.match(/(\d{1,2})\s*[A-Za-z]/);
  if (sheetClassMatch) {
    const sGrade = parseInt(sheetClassMatch[1], 10);
    if (sGrade >= 1 && sGrade <= 12) return sGrade;
  }

  const sheetKhoiMatch = sheetTrimmed.match(/(?:khối|khoi|lớp|lop)\s*(\d{1,2})/i);
  if (sheetKhoiMatch) {
    const kGrade = parseInt(sheetKhoiMatch[1], 10);
    if (kGrade >= 1 && kGrade <= 12) return kGrade;
  }

  return null;
}

/**
 * Transforms raw sheet tables (from .xlsx or .csv) into validated UNIGO Student records.
 * Strictly follows pilot rules:
 * - Only imports Grade 6, 7, 8 students; skips Grade 1-5 sheets safely.
 * - Does NOT invent email, phone, parent, or grades if absent in the file.
 * - Does NOT treat parent GMAIL columns as student login emails.
 * - Reports row-level errors and grade/class breakdowns clearly.
 */
export function processRawSheetsToStudents(
  fileName: string,
  sheets: Array<{ sheetName: string; rows: string[][] }>
): ExcelParseResult {
  const validRows: ParsedStudentRow[] = [];
  const invalidRows: ParsedStudentRow[] = [];
  const columnsDetectedSet = new Set<string>();
  const seenCodesInFile = new Set<string>();
  const skippedNonTargetSheets: string[] = [];
  let skippedNonTargetCount = 0;
  const classBreakdown: Record<string, number> = {};

  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;

    // Find header row (first row containing "họ tên", "mã hs", "lớp", "stt"...)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(sheet.rows.length, 6); i++) {
      const joined = sheet.rows[i].join(" ").toLowerCase();
      if (
        (joined.includes("tên") ||
          joined.includes("mã hs") ||
          joined.includes("lớp") ||
          joined.includes("name") ||
          joined.includes("stt")) &&
        !joined.startsWith("danh sách")
      ) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = sheet.rows[headerRowIdx].map((h) => h.trim());
    const sheetGrade = detectGradeLevel(sheet.sheetName, "", "");

    // Skip non-target grade sheets (e.g. primary school 1a1..5C1)
    if (sheetGrade !== null && !TARGET_PILOT_GRADES.has(sheetGrade)) {
      skippedNonTargetSheets.push(sheet.sheetName);
      const dataRowCount = sheet.rows
        .slice(headerRowIdx + 1)
        .filter((r) => r.some((c) => c && c.trim())).length;
      skippedNonTargetCount += dataRowCount;
      continue;
    }

    headers.forEach((h) => {
      if (h) columnsDetectedSet.add(h);
    });

    const findColExactOrIncludes = (exacts: string[], includes: string[]) =>
      headers.findIndex((h) => {
        const lower = h.toLowerCase().trim();
        if (exacts.includes(lower)) return true;
        return includes.some((kw) => lower.includes(kw));
      });

    const sttIdx = findColExactOrIncludes(["stt"], []);
    const codeIdx = findColExactOrIncludes(
      ["mã hs", "mã học sinh", "student_code", "mahs"],
      ["mã hs", "mã học sinh", "student_code"]
    );
    const fullNameIdx = findColExactOrIncludes(
      ["họ tên hs", "họ và tên", "họ tên", "full_name", "fullname"],
      ["họ và tên", "họ tên"]
    );
    const firstNameIdx = findColExactOrIncludes(["họ đệm"], ["họ đệm"]);
    const lastNameIdx = findColExactOrIncludes(["tên"], []);
    const classIdx = findColExactOrIncludes(["lớp", "class"], ["lớp học"]);
    const gradeIdx = findColExactOrIncludes(["khối", "grade"], ["khối lớp"]);
    const dobIdx = findColExactOrIncludes(
      ["ns", "dob", "ngày sinh"],
      ["ngày sinh", "sinh ngày", "birth"]
    );
    const genderIdx = findColExactOrIncludes(
      ["gt", "gender", "giới tính"],
      ["giới tính", "phái"]
    );
    const hasParentCols =
      findColExactOrIncludes(["tên ph", "đtlh"], ["phụ huynh", "điện thoại"]) >= 0;
    const studentEmailIdx = hasParentCols
      ? findColExactOrIncludes(["email hs", "email học sinh"], ["email học sinh"])
      : findColExactOrIncludes(["email", "thư điện tử"], ["email học sinh"]);

    // Derive default class name from sheetName if sheetName looks like "6A1", "7A1", "8A1"
    const sheetClassMatch = sheet.sheetName.trim().match(/^(\d{1,2}[A-Za-z]\d*)$/);
    const defaultClassFromSheet = sheetClassMatch
      ? sheetClassMatch[1].toUpperCase()
      : "";

    let classSeq = 0;

    for (let r = headerRowIdx + 1; r < sheet.rows.length; r++) {
      const row = sheet.rows[r];
      if (!row || row.every((cell) => !cell || !cell.trim())) continue;

      let fullName = "";
      if (fullNameIdx >= 0) {
        fullName = (row[fullNameIdx] || "").trim();
      } else if (firstNameIdx >= 0 && lastNameIdx >= 0) {
        fullName = `${row[firstNameIdx] || ""} ${row[lastNameIdx] || ""}`.trim();
      } else if (row.length >= 2 && codeIdx >= 0) {
        fullName = (row[1] || "").trim();
      }

      // Skip blank template rows that only have STT or empty name
      if (!fullName && sttIdx >= 0) continue;

      const errors: string[] = [];

      const rawClass =
        (classIdx >= 0 ? row[classIdx] : "")?.trim().toUpperCase() || "";
      const rawGrade = (gradeIdx >= 0 ? row[gradeIdx] : "")?.trim() || "";
      const gradeLevel = detectGradeLevel(
        sheet.sheetName,
        rawClass || defaultClassFromSheet,
        rawGrade
      );

      if (gradeLevel !== null && !TARGET_PILOT_GRADES.has(gradeLevel)) {
        skippedNonTargetCount++;
        continue;
      }

      const resolvedGrade = gradeLevel ?? 6;
      const className =
        rawClass || defaultClassFromSheet || `${resolvedGrade}A1`;

      classSeq++;
      const rawStt = sttIdx >= 0 ? parseInt(row[sttIdx] || "", 10) : NaN;
      const seqNum = Number.isFinite(rawStt) && rawStt > 0 ? rawStt : classSeq;

      const rawCode = (codeIdx >= 0 ? row[codeIdx] || "" : "").trim();
      let studentCode = "";
      let codeGenerated = false;

      if (codeIdx >= 0) {
        // File explicitly has a "Mã HS" column: require valid code
        studentCode = normalizeStudentCode(
          rawCode,
          resolvedGrade,
          seqNum,
          className
        );
        if (!rawCode || rawCode.replace(/\s+/g, "").length < 3) {
          errors.push("Thiếu Mã học sinh hợp lệ (tối thiểu 3 ký tự)");
        }
      } else {
        // File does not have "Mã HS" column (e.g., UNIGO Excel list): generate consistent username HS26-<CLASS>-<NN>
        studentCode = normalizeStudentCode("", resolvedGrade, seqNum, className);
        while (seenCodesInFile.has(studentCode)) {
          classSeq++;
          studentCode = normalizeStudentCode(
            "",
            resolvedGrade,
            classSeq,
            className
          );
        }
        codeGenerated = true;
      }

      const dateOfBirth =
        dobIdx >= 0 ? normalizeDateValue(row[dobIdx]) : null;
      const gender =
        genderIdx >= 0 && row[genderIdx]?.trim() ? row[genderIdx].trim() : null;
      const emailFromFile =
        studentEmailIdx >= 0 && row[studentEmailIdx]?.trim()
          ? row[studentEmailIdx].trim().toLowerCase()
          : null;

      if (!fullName || fullName.length < 2) {
        errors.push("Thiếu Họ và Tên học sinh hợp lệ");
      }
      if (classIdx >= 0 && !rawClass) {
        errors.push("Thiếu tên Lớp học");
      }
      if (!TARGET_PILOT_GRADES.has(resolvedGrade)) {
        errors.push(`Khối lớp không thuộc phạm vi thí điểm 6-8 (${resolvedGrade})`);
      }
      if (seenCodesInFile.has(studentCode)) {
        errors.push(`Trùng mã học sinh (${studentCode}) ngay trong file`);
      } else {
        seenCodesInFile.add(studentCode);
      }

      const parsedRow: ParsedStudentRow = {
        rowNumber: r + 1,
        sheetName: sheet.sheetName,
        studentCode,
        codeGenerated,
        fullName,
        className,
        gradeLevel: resolvedGrade,
        dateOfBirth,
        gender,
        emailFromFile,
        isValid: errors.length === 0,
        errors,
      };

      if (parsedRow.isValid) {
        validRows.push(parsedRow);
        classBreakdown[className] = (classBreakdown[className] || 0) + 1;
      } else {
        invalidRows.push(parsedRow);
      }
    }
  }

  return {
    fileName,
    sheetsDetected: sheets.map((s) => s.sheetName),
    skippedNonTargetSheets,
    skippedNonTargetCount,
    columnsDetected: Array.from(columnsDetectedSet),
    totalRows: validRows.length + invalidRows.length,
    validRows,
    invalidRows,
    gradeBreakdown: {
      grade6: validRows.filter((r) => r.gradeLevel === 6).length,
      grade7: validRows.filter((r) => r.gradeLevel === 7).length,
      grade8: validRows.filter((r) => r.gradeLevel === 8).length,
    },
    classBreakdown,
  };
}

/**
 * Parses CSV text into our ExcelParseResult structure.
 */
export function parseCsvToStudents(
  fileName: string,
  csvText: string
): ExcelParseResult {
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")))
    .filter((row) => row.some((c) => c !== ""));

  return processRawSheetsToStudents(fileName, [
    { sheetName: "Danh sách CSV", rows: lines },
  ]);
}

/**
 * Generates a real OpenXML .xlsx workbook buffer with 3 sheets (Khối 6, Khối 7, Khối 8)
 * representing `DANH SÁCH HỌC SINH NĂM HỌC 2026 - 2027.xlsx`.
 */
export function buildUnigoWorkbookBuffer(): Buffer {
  const sheetData: Array<{ name: string; rows: string[][] }> = [
    {
      name: "Khối 6",
      rows: [
        ["Mã HS", "Họ và Tên", "Lớp", "Khối", "Ngày sinh", "Giới tính"],
        ["HS2026-0601", "Nguyễn Hoàng Bảo Ngọc", "6A1", "6", "14/03/2015", "Nữ"],
        ["HS2026-0602", "Trần Đức Minh", "6A1", "6", "22/07/2015", "Nam"],
        ["HS2026-0603", "Lê Phương Thảo", "6A2", "6", "09/11/2015", "Nữ"],
      ],
    },
    {
      name: "Khối 7",
      rows: [
        ["Mã HS", "Họ và Tên", "Lớp", "Khối", "Ngày sinh", "Giới tính"],
        ["HS2026-0701", "Nguyễn Minh Anh", "7A1", "7", "12/05/2014", "Nữ"],
        ["HS2026-0702", "Trần Gia Bảo", "7A1", "7", "21/08/2014", "Nam"],
        ["HS2026-0703", "Lê Hoàng Nam", "7A1", "7", "03/02/2014", "Nam"],
        ["HS2026-0704", "Phạm Mai Chi", "7A2", "7", "19/09/2014", "Nữ"],
      ],
    },
    {
      name: "Khối 8",
      rows: [
        ["Mã HS", "Họ và Tên", "Lớp", "Khối", "Ngày sinh", "Giới tính"],
        ["HS2026-0801", "Vũ Đức Duy", "8A1", "8", "15/01/2013", "Nam"],
        ["HS2026-0802", "Đỗ Hà My", "8A1", "8", "28/06/2013", "Nữ"],
        ["HS2026-0803", "Hoàng Tuấn Kiệt", "8A2", "8", "11/12/2013", "Nam"],
      ],
    },
  ];

  const colLetters = ["A", "B", "C", "D", "E", "F"];
  const entries: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Khối 6" sheetId="1" r:id="rId1"/>
    <sheet name="Khối 7" sheetId="2" r:id="rId2"/>
    <sheet name="Khối 8" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
</Relationships>`,
  };

  sheetData.forEach((sheet, sIdx) => {
    const rowsXml = sheet.rows
      .map((row, rIdx) => {
        const cellsXml = row
          .map(
            (val, cIdx) =>
              `<c r="${colLetters[cIdx]}${rIdx + 1}" t="inlineStr"><is><t>${val}</t></is></c>`
          )
          .join("");
        return `<row r="${rIdx + 1}">${cellsXml}</row>`;
      })
      .join("");

    entries[`xl/worksheets/sheet${sIdx + 1}.xml`] = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
  });

  return createZipBuffer(entries);
}


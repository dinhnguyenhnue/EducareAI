import zlib from "zlib";

export interface ParsedStudentRow {
  rowNumber: number;
  sheetName: string;
  studentCode: string;
  fullName: string;
  className: string;
  gradeLevel: number;
  dateOfBirth: string | null;
  gender: string | null;
  emailFromFile: string | null; // null if file does not have email
  isValid: boolean;
  errors: string[];
}

export interface ExcelParseResult {
  fileName: string;
  sheetsDetected: string[];
  columnsDetected: string[];
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  gradeBreakdown: {
    grade6: number;
    grade7: number;
    grade8: number;
  };
}

/**
 * Extracts files from a standard ZIP buffer (such as an OpenXML .xlsx file)
 * using Node.js built-in zlib.inflateRawSync.
 */
export function unzipBuffer(zipBuffer: Buffer): Record<string, Buffer> {
  const files: Record<string, Buffer> = {};
  let offset = 0;

  while (offset + 30 <= zipBuffer.length) {
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break; // Reached Central Directory or end of local file headers
    }

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

  // 2. Parse workbook.xml for sheet names
  const sheetNames: string[] = [];
  const workbookXml = entries["xl/workbook.xml"]?.toString("utf-8") || "";
  const sheetTagMatches = workbookXml.match(/<sheet\s+[^>]*\/?>/g) || [];
  for (const tag of sheetTagMatches) {
    const nameMatch = tag.match(/name="([^"]+)"/);
    if (nameMatch) {
      sheetNames.push(decodeXmlEntities(nameMatch[1]));
    }
  }

  // 3. Parse each worksheet xl/worksheets/sheet1.xml, sheet2.xml, ...
  const worksheetKeys = Object.keys(entries)
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.match(/sheet(\d+)\.xml/)?.[1] || "1", 10);
      const numB = parseInt(b.match(/sheet(\d+)\.xml/)?.[1] || "1", 10);
      return numA - numB;
    });

  const result: Array<{ sheetName: string; rows: string[][] }> = [];

  worksheetKeys.forEach((key, sheetIdx) => {
    const sheetName = sheetNames[sheetIdx] || `Sheet${sheetIdx + 1}`;
    const xml = entries[key].toString("utf-8");
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

/**
 * Normalizes student code so re-imports are idempotent and clean.
 */
export function normalizeStudentCode(
  rawCode: string,
  gradeLevel: number,
  seqIndex: number
): string {
  const cleaned = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (cleaned.length >= 4) {
    return cleaned;
  }
  return `HS2026-0${gradeLevel}${String(seqIndex).padStart(2, "0")}`;
}

export function detectGradeLevel(
  sheetName: string,
  className: string,
  explicitGrade: string
): number {
  const gNum = parseInt(explicitGrade, 10);
  if ([6, 7, 8, 9].includes(gNum)) return gNum;

  const classMatch = className.match(/^([6789])/);
  if (classMatch) return parseInt(classMatch[1], 10);

  const sheetMatch = sheetName.match(/([6789])/);
  if (sheetMatch) return parseInt(sheetMatch[1], 10);

  return 7;
}

/**
 * Transforms raw sheet tables (from .xlsx or .csv) into validated UNIGO Student records.
 * Strictly follows Section IX:
 * - Does NOT invent email, phone, parent, or grades if absent in the file.
 * - Separates Grade 6, 7, 8.
 * - Reports row-level errors clearly.
 */
export function processRawSheetsToStudents(
  fileName: string,
  sheets: Array<{ sheetName: string; rows: string[][] }>
): ExcelParseResult {
  const validRows: ParsedStudentRow[] = [];
  const invalidRows: ParsedStudentRow[] = [];
  const columnsDetectedSet = new Set<string>();
  const seenCodesInFile = new Set<string>();

  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;

    // Find header row (first row containing "họ" or "tên" or "mã" or "lớp")
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(sheet.rows.length, 5); i++) {
      const joined = sheet.rows[i].join(" ").toLowerCase();
      if (
        joined.includes("tên") ||
        joined.includes("mã") ||
        joined.includes("lớp") ||
        joined.includes("name")
      ) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = sheet.rows[headerRowIdx].map((h) => h.trim());
    headers.forEach((h) => {
      if (h) columnsDetectedSet.add(h);
    });

    const findCol = (keywords: string[]) =>
      headers.findIndex((h) => {
        const lower = h.toLowerCase();
        return keywords.some((kw) => lower.includes(kw));
      });

    const codeIdx = findCol(["mã hs", "mã học sinh", "student_code", "mahs", "mã"]);
    const fullNameIdx = findCol(["họ và tên", "họ tên", "full_name", "fullname"]);
    const firstNameIdx = findCol(["họ đệm"]);
    const lastNameIdx = findCol(["tên"]);
    const classIdx = findCol(["lớp", "class"]);
    const gradeIdx = findCol(["khối", "grade"]);
    const dobIdx = findCol(["ngày sinh", "sinh ngày", "dob", "birth"]);
    const genderIdx = findCol(["giới tính", "phái", "gender"]);
    const emailIdx = findCol(["email", "thư điện tử"]);

    for (let r = headerRowIdx + 1; r < sheet.rows.length; r++) {
      const row = sheet.rows[r];
      if (!row || row.every((cell) => !cell || !cell.trim())) continue;

      const errors: string[] = [];

      let fullName = "";
      if (fullNameIdx >= 0) {
        fullName = (row[fullNameIdx] || "").trim();
      } else if (firstNameIdx >= 0 && lastNameIdx >= 0) {
        fullName = `${row[firstNameIdx] || ""} ${row[lastNameIdx] || ""}`.trim();
      } else if (row.length >= 2) {
        fullName = (row[1] || "").trim();
      }

      const rawClass =
        (classIdx >= 0 ? row[classIdx] : "")?.trim().toUpperCase() || "";
      const rawGrade = (gradeIdx >= 0 ? row[gradeIdx] : "")?.trim() || "";
      const gradeLevel = detectGradeLevel(sheet.sheetName, rawClass, rawGrade);
      const className = rawClass || `${gradeLevel}A1`;

      const rawCode = codeIdx >= 0 ? row[codeIdx] || "" : row[0] || "";
      const studentCode = normalizeStudentCode(rawCode, gradeLevel, r);

      const dateOfBirth =
        dobIdx >= 0 && row[dobIdx]?.trim() ? row[dobIdx].trim() : null;
      const gender =
        genderIdx >= 0 && row[genderIdx]?.trim() ? row[genderIdx].trim() : null;
      const emailFromFile =
        emailIdx >= 0 && row[emailIdx]?.trim()
          ? row[emailIdx].trim().toLowerCase()
          : null;

      if (!fullName || fullName.length < 2) {
        errors.push("Thiếu Họ và Tên học sinh hợp lệ");
      }
      if (![6, 7, 8, 9].includes(gradeLevel)) {
        errors.push(`Khối lớp không hợp lệ (${gradeLevel})`);
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
        fullName,
        className,
        gradeLevel,
        dateOfBirth,
        gender,
        emailFromFile,
        isValid: errors.length === 0,
        errors,
      };

      if (parsedRow.isValid) {
        validRows.push(parsedRow);
      } else {
        invalidRows.push(parsedRow);
      }
    }
  }

  return {
    fileName,
    sheetsDetected: sheets.map((s) => s.sheetName),
    columnsDetected: Array.from(columnsDetectedSet),
    totalRows: validRows.length + invalidRows.length,
    validRows,
    invalidRows,
    gradeBreakdown: {
      grade6: validRows.filter((r) => r.gradeLevel === 6).length,
      grade7: validRows.filter((r) => r.gradeLevel === 7).length,
      grade8: validRows.filter((r) => r.gradeLevel === 8).length,
    },
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


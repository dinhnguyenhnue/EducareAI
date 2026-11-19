import { PILOT_CURRICULUM, GRADE6_GEMINI_GEMS } from "./pilot-curriculum";
import { GRADE6_DEMO } from "./grade6-demo";

export interface TutorSubjectOption {
  subjectCode: string;
  subjectName: string;
  gradeLevel: number;
  tutorName: string;
  defaultLessonTitle: string;
  defaultObjective: string;
  knowledgeExcerpt: string;
  externalGemUrl: string | null;
  starterPrompts: string[];
}

export interface ClassGemOverride {
  className: string;
  subjectCode: string;
  gemUrl: string;
  tutorTitle?: string;
}

/**
 * Class-specific Gem overrides demonstrating that two classes in the same grade
 * can use different Gems (or one class has a Gem while another uses shared/none).
 */
export const DEFAULT_CLASS_GEM_OVERRIDES: ClassGemOverride[] = [
  {
    className: "6A1",
    subjectCode: "TIN6",
    gemUrl:
      "https://gemini.google.com/gem/1OQWZbbNYX0Rd31rxR4GSFnaZBFp_25UT?usp=sharing",
    tutorTitle: "Gia sư Tin học 6 (Lớp 6A1)",
  },
  {
    className: "6A1",
    subjectCode: "TOAN6",
    gemUrl:
      "https://gemini.google.com/gem/1PKLRoijfUfwDTaphAS3Z5Cp6myY6oHjH?usp=sharing",
    tutorTitle: "Gia sư Toán 6 (Lớp 6A1)",
  },
  {
    className: "6A1",
    subjectCode: "VAN6",
    gemUrl:
      "https://gemini.google.com/gem/1wiR7gayxW1di8utJ6W5pemqKZTF6_TZq?usp=sharing",
    tutorTitle: "Gia sư Ngữ văn 6 (Lớp 6A1)",
  },
];

export const QUICK_INTENT_ACTIONS = [
  {
    id: "EXPLAIN_CONCEPT",
    label: "Giải thích khái niệm",
    buildText: (lessonTitle: string) =>
      `Em đang học "${lessonTitle}". Thầy/cô giải thích ngắn gọn khái niệm trọng tâm bằng một ví dụ gần gũi rồi hỏi lại để em tự kiểm tra nhé.`,
  },
  {
    id: "NEXT_STEP_HINT",
    label: "Gợi ý bước tiếp theo",
    buildText: (lessonTitle: string) =>
      `Trong bài "${lessonTitle}", em đã đọc đề bài nhưng chưa biết bắt đầu từ bước nào. Thầy/cô gợi ý vừa đủ bước tiếp theo để em tự làm tiếp nhé.`,
  },
  {
    id: "PRACTICE_ONE_QUESTION",
    label: "Cho em luyện một câu",
    buildText: (lessonTitle: string) =>
      `Thầy/cô cho em 1 câu hỏi vận dụng ngắn thuộc bài "${lessonTitle}" và chờ em trả lời trước khi nhận xét nhé.`,
  },
];

/**
 * Resolves the tutor catalog for a given grade and specific className.
 * Prioritizes (className + subjectCode) config before falling back to shared (grade + subjectCode).
 */
export function resolveTutorCatalogForClass(
  gradeLevel: number,
  className: string,
  customOverrides: ClassGemOverride[] = DEFAULT_CLASS_GEM_OVERRIDES
): TutorSubjectOption[] {
  const cleanClass = (className || `${gradeLevel}A1`).trim().toUpperCase();
  const resolvedGrade: 6 | 7 | 8 =
    gradeLevel === 6 || gradeLevel === 7 || gradeLevel === 8 ? gradeLevel : 6;

  const findGemUrl = (subjectCode: string, sharedGemUrl: string | null): string | null => {
    const classSpecific = customOverrides.find(
      (o) =>
        o.className.toUpperCase() === cleanClass &&
        o.subjectCode.toUpperCase() === subjectCode.toUpperCase()
    );
    if (classSpecific) return classSpecific.gemUrl;
    return sharedGemUrl;
  };

  const pilotTin = PILOT_CURRICULUM[resolvedGrade];
  const tinCode = `TIN${resolvedGrade}`;
  const sharedTinGem =
    resolvedGrade === 6
      ? GRADE6_GEMINI_GEMS.find((g) => g.subject === "Tin học 6")?.url || null
      : null;

  const tinOption: TutorSubjectOption = {
    subjectCode: tinCode,
    subjectName: `Tin học ${resolvedGrade}`,
    gradeLevel: resolvedGrade,
    tutorName: `Gia sư Tin học ${resolvedGrade}`,
    defaultLessonTitle: pilotTin.lessonTitle,
    defaultObjective: pilotTin.objectives[0] || "Nắm vững kiến thức trọng tâm bài học.",
    knowledgeExcerpt: pilotTin.keyTakeaways.join(" "),
    externalGemUrl: findGemUrl(tinCode, sharedTinGem),
    starterPrompts:
      resolvedGrade === 6
        ? [
            "Em thấy cùng một con số có thể mang nhiều ý nghĩa. Thầy/cô cho em một ví dụ rồi hỏi em đâu là dữ liệu, đâu là thông tin được không?",
            `Em đang học ${pilotTin.lessonTitle}. Em muốn phân biệt thông tin với vật mang tin qua ví dụ tấm bảng Đảo Cò.`,
          ]
        : resolvedGrade === 7
        ? [
            "Em nghĩ màn hình cảm ứng là thiết bị ra. Thầy/cô gợi ý một thao tác để em tự kiểm tra xem còn chức năng nào khác không?",
            `Em đang học ${pilotTin.lessonTitle}. Vì sao cần kết nối các thiết bị vào – ra trước khi cắm nguồn điện?`,
          ]
        : [
            `Em đang học ${pilotTin.lessonTitle}. Vì sao Charles Babbage được coi là cha đẻ của công nghệ máy tính dù dự án năm 1833 chưa hoàn thành?`,
            "Thầy/cô đố em một câu để phân biệt công nghệ linh kiện của 5 thế hệ máy tính điện tử nhé.",
          ],
  };

  const mathCode = `TOAN${resolvedGrade}`;
  const mathDemo6 = GRADE6_DEMO.find((d) => d.subjectCode === "TOAN6");
  const sharedMathGem =
    resolvedGrade === 6
      ? GRADE6_GEMINI_GEMS.find((g) => g.subject === "Toán 6")?.url || null
      : null;
  const mathLessonTitle =
    resolvedGrade === 6
      ? "Bài 1. Tập hợp (SGK Toán 6 Tập 1 - KNTT)"
      : resolvedGrade === 7
      ? "Tỉ lệ thức và đại lượng tỉ lệ (Toán 7)"
      : "Đa thức nhiều biến (Toán 8)";

  const mathOption: TutorSubjectOption = {
    subjectCode: mathCode,
    subjectName: `Toán ${resolvedGrade}`,
    gradeLevel: resolvedGrade,
    tutorName: `Gia sư Toán ${resolvedGrade}`,
    defaultLessonTitle: mathLessonTitle,
    defaultObjective:
      mathDemo6?.chapters[0]?.objectives ||
      `Vận dụng kiến thức Toán ${resolvedGrade} để giải bài toán từng bước.`,
    knowledgeExcerpt:
      mathDemo6?.chapters[0]?.summarySource ||
      `Kiến thức Toán ${resolvedGrade} theo chương trình GDPT 2018.`,
    externalGemUrl: findGemUrl(mathCode, sharedMathGem),
    starterPrompts: [
      `Em đang học ${mathLessonTitle}. Em đã thử viết các bước đầu nhưng còn vướng ở cách trình bày điều kiện. Thầy/cô cho em một gợi ý để em tự làm tiếp nhé.`,
      `Thầy/cô cho em một ví dụ tương tự trong ${mathLessonTitle} rồi hỏi lại để em tự giải nhé.`,
    ],
  };

  const vanCode = `VAN${resolvedGrade}`;
  const vanDemo6 = GRADE6_DEMO.find((d) => d.subjectCode === "VAN6");
  const sharedVanGem =
    resolvedGrade === 6
      ? GRADE6_GEMINI_GEMS.find((g) => g.subject === "Ngữ văn 6")?.url || null
      : null;
  const vanLessonTitle =
    resolvedGrade === 6
      ? "Bài 1. Tôi và các bạn — Truyện đồng thoại (Ngữ văn 6 Tập 1 - KNTT)"
      : resolvedGrade === 7
      ? "Bài văn nghị luận và phản biện (Ngữ văn 7)"
      : "Đọc hiểu văn bản lịch sử và nghị luận (Ngữ văn 8)";

  const vanOption: TutorSubjectOption = {
    subjectCode: vanCode,
    subjectName: `Ngữ văn ${resolvedGrade}`,
    gradeLevel: resolvedGrade,
    tutorName: `Gia sư Ngữ văn ${resolvedGrade}`,
    defaultLessonTitle: vanLessonTitle,
    defaultObjective:
      vanDemo6?.chapters[0]?.objectives ||
      `Nhận diện đặc điểm thể loại và rèn kỹ năng diễn đạt môn Ngữ văn ${resolvedGrade}.`,
    knowledgeExcerpt:
      vanDemo6?.chapters[0]?.summarySource ||
      `Kiến thức Ngữ văn ${resolvedGrade} theo chương trình GDPT 2018.`,
    externalGemUrl: findGemUrl(vanCode, sharedVanGem),
    starterPrompts: [
      `Em đang học ${vanLessonTitle}. Em đã thử tìm chi tiết miêu tả nhân vật nhưng chưa biết rút ra ý nghĩa. Thầy/cô cho em một gợi ý để em tự làm tiếp nhé.`,
    ],
  };

  return [tinOption, mathOption, vanOption];
}

/**
 * Builds the exact server-verified System Prompt required by Section 5 of PROMPT_TRIEN_KHAI_LUONG_HOC_SINH.md.
 */
export function buildVerifiedSocraticSystemPrompt(params: {
  subjectName: string;
  gradeLevel: number;
  anonymousClassLabel: string;
  lessonTitle: string;
  objective: string;
  serverModeLabel: string;
  knowledgeContext?: string;
}): string {
  const baseInstruction = `Bạn là gia sư môn ${params.subjectName}, khối ${params.gradeLevel}, phụ trách nhóm lớp ${params.anonymousClassLabel}. Bài hôm nay là ${params.lessonTitle}. Mục tiêu là ${params.objective}. Dùng tiếng Việt phù hợp lứa tuổi. Hãy đọc điều em đã thử, chỉ ra một ý đúng hoặc điểm em còn vướng và đưa một gợi ý vừa đủ. Kết thúc bằng một câu hỏi để em tự làm bước tiếp theo. Nếu em cần ví dụ, dùng một ví dụ tương tự rồi mời em quay lại bài của mình. Chế độ hiện tại là ${params.serverModeLabel}. Khi có bài kiểm tra đang diễn ra, chỉ hướng dẫn khái niệm chung và giữ kín lời giải, đáp án của đề. Nếu học liệu được cấp chưa đủ, hãy nói rõ phần còn thiếu và mời em trích phần liên quan. Giữ kín dữ liệu cá nhân, hội thoại và kết quả của người học khác.`;

  if (params.knowledgeContext && params.knowledgeContext.trim()) {
    return `${baseInstruction}\n\n[Ngữ liệu bài học đã xác thực từ SGK]: ${params.knowledgeContext.trim()}`;
  }
  return baseInstruction;
}

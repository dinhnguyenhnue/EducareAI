export interface DemoQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface DemoChapter {
  code: string;
  title: string;
  printPages: string;
  pdfPages: string;
  lessons: string[];
  objectives: string;
  summarySource: string;
}

export interface DemoSubject {
  id: string;
  subjectCode: "TOAN6" | "VAN6";
  name: "Toán" | "Ngữ văn";
  bookTitle: string;
  bookSeries: "Kết nối tri thức với cuộc sống";
  publisher: string;
  isbn: string;
  localRelativePath: string;
  driveTargetPath: string;
  pageOffset: number;
  topics: string[];
  chapters: DemoChapter[];
  lesson: string;
  exercise: string;
  semester: string;
  exam: string;
  answers: string;
  games: { title: string; chapterRef: string; questions: DemoQuestion[] }[];
}

const q = (
  question: string,
  options: string[],
  answer: number,
  explanation: string
): DemoQuestion => ({ question, options, answer, explanation });

export const GRADE6_DEMO: DemoSubject[] = [
  {
    id: "toan",
    subjectCode: "TOAN6",
    name: "Toán",
    bookTitle: "Toán 6 - Tập một",
    bookSeries: "Kết nối tri thức với cuộc sống",
    publisher: "Nhà xuất bản Giáo dục Việt Nam",
    isbn: "978-604-0-25151-0",
    localRelativePath: "SGK/Lop_6/Toan/Tap_1/SGK_Toan_6_Tap_1_KNTT.pdf",
    driveTargetPath:
      "EDUCARE_AI/02_HOC_LIEU/Toan/Lop_6/Tap_1/SGK_Toan_6_Tap_1_KNTT.pdf",
    pageOffset: 1,
    topics: [
      "Chương I: Tập hợp các số tự nhiên (tr.5–28 / PDF tr.6–29)",
      "Chương II: Tính chia hết trong tập hợp các số tự nhiên (tr.29–56 / PDF tr.30–57)",
      "Chương III: Số nguyên (tr.57–76 / PDF tr.58–77)",
      "Chương IV: Một số hình phẳng trong thực tiễn (tr.77–97 / PDF tr.78–98)",
      "Chương V: Tính đối xứng của hình phẳng trong tự nhiên (tr.98–110 / PDF tr.99–111)",
    ],
    chapters: [
      {
        code: "TOAN6_CH1",
        title: "Chương I. Tập hợp các số tự nhiên",
        printPages: "5–28",
        pdfPages: "6–29",
        lessons: [
          "Bài 1. Tập hợp (tr.5)",
          "Bài 2. Cách ghi số tự nhiên (tr.9)",
          "Bài 3. Thứ tự trong tập hợp các số tự nhiên (tr.13)",
          "Bài 4. Phép cộng và phép trừ số tự nhiên (tr.15)",
          "Bài 5. Phép nhân và phép chia số tự nhiên (tr.17)",
          "Bài 6. Lũy thừa với số mũ tự nhiên (tr.22)",
          "Bài 7. Thứ tự thực hiện các phép tính (tr.25)",
          "Luyện tập chung & Bài tập cuối chương I (tr.20, 27, 28)",
        ],
        objectives:
          "Biết viết tập hợp, dùng kí hiệu ∈ / ∉; đọc viết số La Mã; thực hiện lũy thừa aⁿ (aᵐ·aⁿ = aᵐ⁺ⁿ, aᵐ:aⁿ = aᵐ⁻ⁿ) và thứ tự phép tính có ngoặc ( ) → [ ] → { }.",
        summarySource:
          "SGK Toán 6 Tập 1 (KNTT), Chương I (trang in 5–28, PDF 6–29): Tập hợp các phần tử, tập hợp N và N*, hệ thập phân và số La Mã; tính chất giao hoán, kết hợp, phân phối; lũy thừa bậc n của a (a⁰ = 1 với a ≠ 0); thứ tự ưu tiên: ngoặc tròn → ngoặc vuông → ngoặc nhọn; nâng lên lũy thừa → nhân chia → cộng trừ.",
      },
      {
        code: "TOAN6_CH2",
        title: "Chương II. Tính chia hết trong tập hợp các số tự nhiên",
        printPages: "29–56",
        pdfPages: "30–57",
        lessons: [
          "Bài 8. Quan hệ chia hết và tính chất (tr.29)",
          "Bài 9. Dấu hiệu chia hết (tr.34)",
          "Bài 10. Số nguyên tố (tr.38)",
          "Bài 11. Ước chung. Ước chung lớn nhất (tr.44)",
          "Bài 12. Bội chung. Bội chung nhỏ nhất (tr.49)",
          "Luyện tập chung & Bài tập cuối chương II (tr.43, 54, 56)",
        ],
        objectives:
          "Vận dụng tính chất chia hết của một tổng, dấu hiệu chia hết cho 2, 3, 5, 9; phân tích hợp số ra thừa số nguyên tố; tìm ƯCLN và BCNN để giải bài toán chia nhóm và chu kì thực tiễn.",
        summarySource:
          "SGK Toán 6 Tập 1 (KNTT), Chương II (trang in 29–56, PDF 30–57): Quan hệ ước và bội; số nguyên tố chỉ có hai ước là 1 và chính nó, hợp số có nhiều hơn hai ước (0 và 1 không là số nguyên tố cũng không là hợp số); phân tích ra thừa số nguyên tố; quy tắc tìm ƯCLN và BCNN bằng thừa số nguyên tố chung/riêng.",
      },
      {
        code: "TOAN6_CH3",
        title: "Chương III. Số nguyên",
        printPages: "57–76",
        pdfPages: "58–77",
        lessons: [
          "Bài 13. Tập hợp các số nguyên (tr.57)",
          "Bài 14. Phép cộng và phép trừ số nguyên (tr.62)",
          "Bài 15. Quy tắc dấu ngoặc (tr.67)",
          "Bài 16. Phép nhân số nguyên (tr.70)",
          "Bài 17. Phép chia hết. Ước và bội của một số nguyên (tr.73)",
          "Luyện tập chung & Bài tập cuối chương III (tr.69, 75, 76)",
        ],
        objectives:
          "Biểu diễn số nguyên âm/dương trên trục số; tìm số đối; cộng, trừ, nhân, chia hết số nguyên; vận dụng quy tắc dấu ngoặc khi bỏ ngoặc có dấu '+' hoặc '-' đứng trước.",
        summarySource:
          "SGK Toán 6 Tập 1 (KNTT), Chương III (trang in 57–76, PDF 58–77): Tập hợp Z = {..., -2, -1, 0, 1, 2, ...}; số đối của a là -a; quy tắc cộng cùng dấu/khác dấu; trừ số nguyên a - b = a + (-b); bỏ ngoặc có dấu '-' đằng trước phải đổi dấu tất cả số hạng trong ngoặc; nhân hai số nguyên cùng dấu cho kết quả dương, khác dấu cho kết quả âm.",
      },
      {
        code: "TOAN6_CH4",
        title: "Chương IV. Một số hình phẳng trong thực tiễn",
        printPages: "77–97",
        pdfPages: "78–98",
        lessons: [
          "Bài 18. Hình tam giác đều. Hình vuông. Hình lục giác đều (tr.77)",
          "Bài 19. Hình chữ nhật. Hình thoi. Hình bình hành. Hình thang cân (tr.83)",
          "Bài 20. Chu vi và diện tích của một số tứ giác đã học (tr.90)",
          "Luyện tập chung & Bài tập cuối chương IV (tr.95, 97)",
        ],
        objectives:
          "Nhận biết đặc điểm cạnh, góc, đường chéo của tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình thoi, hình bình hành, hình thang cân; tính đúng chu vi và diện tích trong các bài toán thực tiễn.",
        summarySource:
          "SGK Toán 6 Tập 1 (KNTT), Chương IV (trang in 77–97, PDF 78–98): Lục giác đều gồm 6 tam giác đều bằng nhau; hình thoi có 4 cạnh bằng nhau, hai đường chéo vuông góc, diện tích S = 1/2·d1·d2; hình bình hành có cạnh đối song song và bằng nhau, S = a·h; hình thang cân có hai cạnh bên bằng nhau, hai đường chéo bằng nhau, S = (a+b)·h/2.",
      },
      {
        code: "TOAN6_CH5",
        title: "Chương V. Tính đối xứng của hình phẳng trong tự nhiên",
        printPages: "98–110",
        pdfPages: "99–111",
        lessons: [
          "Bài 21. Hình có trục đối xứng (tr.98)",
          "Bài 22. Hình có tâm đối xứng (tr.103)",
          "Luyện tập chung & Bài tập cuối chương V (tr.108, 110)",
        ],
        objectives:
          "Nhận biết hình có trục đối xứng, hình có tâm đối xứng và chỉ ra trục đối xứng/tâm đối xứng của các hình phẳng quen thuộc trong tự nhiên, nghệ thuật.",
        summarySource:
          "SGK Toán 6 Tập 1 (KNTT), Chương V (trang in 98–110, PDF 99–111): Hình vuông có 4 trục đối xứng và 1 tâm đối xứng (giao điểm hai đường chéo); hình chữ nhật có 2 trục đối xứng và 1 tâm đối xứng; hình bình hành nói chung không có trục đối xứng nhưng có 1 tâm đối xứng; hình thang cân có 1 trục đối xứng nhưng không có tâm đối xứng; hình tròn có vô số trục đối xứng và 1 tâm đối xứng.",
      },
    ],
    lesson: `NGUỒN CHÍNH THỨC: SGK Toán 6 - Tập một (Bộ Kết nối tri thức với cuộc sống - NXB Giáo dục Việt Nam, ISBN 978-604-0-25151-0)
Quy tắc đối chiếu trang: Trang PDF = Trang sách in + 1 (ví dụ: Chương I bắt đầu ở trang in 5 → trang PDF 6).

1. CHƯƠNG I — TẬP HỢP CÁC SỐ TỰ NHIÊN (tr. 5–28 / PDF 6–29)
- Tập hợp dùng dấu ngoặc nhọn { }, kí hiệu ∈ (thuộc) và ∉ (không thuộc).
- Lũy thừa bậc n của a (Bài 6, tr. 22): aⁿ = a · a · ... · a (n thừa số). Quy ước a¹ = a; aᵐ · aⁿ = aᵐ⁺ⁿ; aᵐ : aⁿ = aᵐ⁻ⁿ (a ≠ 0, m ≥ n).
- Thứ tự thực hiện phép tính (Bài 7, tr. 25): ( ) → [ ] → { }; sau đó Lũy thừa → Nhân và chia → Cộng và trừ.

2. CHƯƠNG II — TÍNH CHIA HẾT TRONG N (tr. 29–56 / PDF 30–57)
- Số nguyên tố (Bài 10, tr. 38): số tự nhiên > 1 chỉ có 2 ước là 1 và chính nó (2, 3, 5, 7, 11...). Hợp số có nhiều hơn hai ước. Số 0 và số 1 không là số nguyên tố cũng không là hợp số.
- ƯCLN (Bài 11, tr. 44) & BCNN (Bài 12, tr. 49): Phân tích mỗi số ra thừa số nguyên tố rồi chọn tích các thừa số nguyên tố chung (lấy số mũ nhỏ nhất để tìm ƯCLN) hoặc chung và riêng (lấy số mũ lớn nhất để tìm BCNN).

3. CHƯƠNG III — SỐ NGUYÊN (tr. 57–76 / PDF 58–77)
- Tập hợp số nguyên Z = {..., -2, -1, 0, 1, 2, ...}. Hai số đối nhau có tổng bằng 0 (số đối của a là -a).
- Quy tắc dấu ngoặc (Bài 15, tr. 67): Khi bỏ ngoặc có dấu "-" đứng trước thì phải đổi dấu mọi số hạng trong ngoặc ("+" → "-" và "-" → "+").
- Phép nhân số nguyên (Bài 16, tr. 70): Tích hai số nguyên cùng dấu là số dương; tích hai số nguyên khác dấu là số âm.

4. CHƯƠNG IV & V — HÌNH PHẲNG & TÍNH ĐỐI XỨNG (tr. 77–110 / PDF 78–111)
- Chu vi và diện tích (Bài 20, tr. 90): Hình thoi S = ½ · d₁ · d₂; Hình bình hành S = a · h; Hình thang cân S = (a + b) · h / 2.
- Tính đối xứng (Bài 21–22, tr. 98–107): Hình thoi và hình chữ nhật có cả trục đối xứng (2 trục) lẫn tâm đối xứng; hình thang cân chỉ có 1 trục đối xứng; hình bình hành chỉ có tâm đối xứng.`,
    exercise: `BÀI TẬP CỦNG CỐ THEO CHƯƠNG — TOÁN 6 TẬP 1 (KNTT)

Bài 1 (Chương I — Bài 6, 7, tr. 22–26): Thực hiện phép tính:
  a) 2⁴ · 2² : 2³ + 3² · 5     b) 120 - [58 - (16 - 12)²]

Bài 2 (Chương II — Bài 10, 11, 12, tr. 38–53):
  a) Phân tích 48 và 72 ra thừa số nguyên tố, từ đó tìm ƯCLN(48, 72) và BCNN(48, 72).
  b) Lớp 6A có 24 bạn nam và 18 bạn nữ muốn chia đều vào các tổ sao cho số nam và số nữ ở mỗi tổ như nhau. Có thể chia được nhiều nhất thành bao nhiêu tổ? Khi đó mỗi tổ có bao nhiêu nam, bao nhiêu nữ?

Bài 3 (Chương III — Bài 14, 15, 16, tr. 62–72): Tính hợp lí:
  a) (-25) + 17 + 25 + (-37)     b) 135 - (35 - 48) - 48     c) (-12) · 45 + (-12) · 55

Bài 4 (Chương IV — Bài 20, tr. 90–94): Một mảnh vườn hình thang cân có đáy nhỏ 8 m, đáy lớn 14 m và chiều cao 6 m. Ở giữa vườn người ta làm một lối đi hình bình hành có cạnh đáy 2 m và chiều cao 6 m. Tính diện tích phần đất trồng rau còn lại.

Bài 5 (Chương V — Bài 21, 22, tr. 98–107): Trong các hình: hình vuông, hình bình hành, hình thang cân, hình lục giác đều — hình nào vừa có trục đối xứng vừa có tâm đối xứng? Chỉ rõ số trục đối xứng của hình đó.`,
    semester: `ĐỀ CƯƠNG ÔN TẬP HỌC KÌ I — TOÁN 6 (KẾT NỐI TRI THỨC TẬP 1)

• Buổi 1 — Chương I (tr. 5–28 / PDF 6–29): Tập hợp, ghi số tự nhiên, lũy thừa, thứ tự phép tính.
  Bài luyện nhanh: Tính 5³ : 5² + 2 · [30 - (12 - 9)²].
• Buổi 2 — Chương II (tr. 29–56 / PDF 30–57): Dấu hiệu chia hết, số nguyên tố, phân tích TSNT, ƯCLN và BCNN.
  Bài luyện nhanh: Tìm số tự nhiên nhỏ nhất khác 0 chia hết cho cả 12, 15 và 18.
• Buổi 3 — Chương III (tr. 57–76 / PDF 58–77): Trục số nguyên, cộng trừ nhân chia hết trong Z, quy tắc dấu ngoặc.
  Bài luyện nhanh: Bỏ ngoặc và tính (-42 + 75) - (58 - 25).
• Buổi 4 — Chương IV (tr. 77–97 / PDF 78–98): Đặc điểm tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình thoi, hình bình hành, hình thang cân và công thức chu vi, diện tích.
  Bài luyện nhanh: Hình thoi có độ dài hai đường chéo là 12 cm và 18 cm. Tính diện tích.
• Buổi 5 — Chương V (tr. 98–110 / PDF 99–111) & Tổng luyện đề HK1: Trục đối xứng, tâm đối xứng và tự giải đề kiểm tra thử 60 phút, rà soát lỗi tính nhẩm dấu nguyên âm và đơn vị diện tích.

Đáp án tự kiểm tra buổi 1–4: 5 + 42 = 47; BCNN(12,15,18) = 180; 33 - 33 = 0; S = ½ · 12 · 18 = 108 cm².`,
    exam: `ĐỀ KIỂM TRA THỬ HỌC KÌ I — TOÁN 6 (BỘ KẾT NỐI TRI THỨC - TẬP 1)
Thời gian: 60 phút • Thang điểm: 10,0 điểm
Ma trận nội dung bám sát KNTT Tập 1: Chương I & II (4,5 đ) • Chương III Số nguyên (2,5 đ) • Chương IV & V Hình phẳng & Đối xứng (3,0 đ).

I. TRẮC NGHIỆM KHÁCH QUAN (4,0 điểm — mỗi câu 0,5 điểm)
Câu 1 (Chương I, tr. 6): Cho tập hợp A = {x ∈ N | 3 ≤ x < 7}. Cách viết liệt kê đúng là:
  A. {3; 4; 5; 6; 7}   B. {4; 5; 6}   C. {3; 4; 5; 6}   D. {4; 5; 6; 7}
Câu 2 (Chương I, tr. 23): Kết quả của phép tính 3⁵ : 3² viết dưới dạng một lũy thừa là:
  A. 3⁷   B. 3³   C. 1³   D. 3¹⁰
Câu 3 (Chương II, tr. 38): Trong các số 1; 19; 27; 51, số nào là số nguyên tố?
  A. 1   B. 19   C. 27   D. 51
Câu 4 (Chương II, tr. 46): ƯCLN(24, 36) bằng:
  A. 6   B. 12   C. 24   D. 72
Câu 5 (Chương III, tr. 64): Kết quả của phép tính (-18) + 25 là:
  A. -43   B. -7   C. 7   D. 43
Câu 6 (Chương III, tr. 67): Khi bỏ dấu ngoặc trong biểu thức 15 - (8 - 12), ta được:
  A. 15 - 8 - 12   B. 15 + 8 - 12   C. 15 - 8 + 12   D. 15 + 8 + 12
Câu 7 (Chương IV, tr. 92): Diện tích hình thoi có độ dài hai đường chéo 10 cm và 8 cm là:
  A. 18 cm²   B. 36 cm²   C. 40 cm²   D. 80 cm²
Câu 8 (Chương V, tr. 99–105): Hình nào sau đây có trục đối xứng nhưng KHÔNG có tâm đối xứng?
  A. Hình vuông   B. Hình chữ nhật   C. Hình thoi   D. Hình thang cân

II. TỰ LUẬN (6,0 điểm)
Câu 9 (2,0 điểm — Chương I & III): Tính hợp lí (nếu có thể):
  a) 48 : 2³ + 3 · (17 - 12)²     b) (-37) · 64 + (-37) · 36
Câu 10 (2,0 điểm — Chương II): Một đoàn học sinh khối 6 đi tham quan có khoảng từ 100 đến 150 em. Khi xếp hàng 10, hàng 12 hay hàng 15 đều vừa đủ hàng. Tính số học sinh tham quan của khối 6.
Câu 11 (2,0 điểm — Chương IV): Một nền căn phòng hình chữ nhật có chiều dài 8 m, chiều rộng 5 m.
  a) Tính diện tích nền căn phòng.
  b) Người ta dùng loại gạch men hình vuông cạnh 40 cm để lát kín nền phòng đó (coi mạch vữa không đáng kể). Hỏi cần ít nhất bao nhiêu viên gạch?`,
    answers: `HƯỚNG DẪN CHẤM BÀI TẬP & ĐỀ KIỂM TRA THỬ HK1 — TOÁN 6 KNTT TẬP 1

A. Đáp án Bài tập củng cố:
- Bài 1: a) 2³ + 9 · 5 = 8 + 45 = 53; b) 120 - [58 - 16] = 120 - 42 = 78.
- Bài 2: a) 48 = 2⁴ · 3; 72 = 2³ · 3² ⇒ ƯCLN(48, 72) = 2³ · 3 = 24; BCNN(48, 72) = 2⁴ · 3² = 144.
  b) Số tổ nhiều nhất là ƯCLN(24, 18) = 6 tổ. Mỗi tổ có 4 nam và 3 nữ.
- Bài 3: a) [(-25) + 25] + [17 + (-37)] = 0 + (-20) = -20.
  b) 135 - 35 + 48 - 48 = 100.
  c) (-12) · (45 + 55) = (-12) · 100 = -1200.
- Bài 4: Diện tích vườn hình thang cân: (8 + 14) · 6 / 2 = 66 m². Diện tích lối đi: 2 · 6 = 12 m². Phần trồng rau: 66 - 12 = 54 m².
- Bài 5: Hình vuông (4 trục đối xứng, 1 tâm) và hình lục giác đều (6 trục đối xứng, 1 tâm) đều có cả trục và tâm đối xứng.

B. Đáp án Đề kiểm tra thử HK1 (10,0 điểm):
I. Trắc nghiệm (4,0 đ — mỗi câu 0,5 đ):
  1C ({3;4;5;6}) • 2B (3³) • 3B (19) • 4B (12) • 5C (7) • 6C (15 - 8 + 12) • 7C (40 cm²) • 8D (Hình thang cân).
II. Tự luận (6,0 đ):
  Câu 9 (2,0 đ):
    a) 48 : 8 + 3 · 5² = 6 + 3 · 25 = 6 + 75 = 81 (1,0 đ).
    b) (-37) · (64 + 36) = (-37) · 100 = -3700 (1,0 đ).
  Câu 10 (2,0 đ): Gọi số học sinh là x (x ∈ N*, 100 ≤ x ≤ 150) (0,5 đ). Vì x chia hết cho 10, 12, 15 nên x ∈ BC(10, 12, 15). Ta có 10 = 2·5; 12 = 2²·3; 15 = 3·5 ⇒ BCNN(10, 12, 15) = 2²·3·5 = 60 (0,75 đ). Suy ra x ∈ BC(10, 12, 15) = {0; 60; 120; 180; ...}. Vì 100 ≤ x ≤ 150 nên x = 120. Vậy đoàn có 120 học sinh (0,75 đ).
  Câu 11 (2,0 đ):
    a) Diện tích nền phòng: 8 · 5 = 40 m² = 400 000 cm² (1,0 đ).
    b) Diện tích 1 viên gạch: 40 · 40 = 1600 cm². Số viên gạch: 400 000 : 1600 = 250 viên (1,0 đ).`,
    games: [
      {
        title: "Kho báu Ước & Bội — Chương I & II (SGK Toán 6 KNTT Tập 1)",
        chapterRef: "Chương I & II (tr. 5–56 / PDF 6–57)",
        questions: [
          q(
            "Theo Bài 1 (tr. 6), cho tập hợp M = {2; 4; 6; 8}. Khẳng định nào sau đây là ĐÚNG?",
            ["5 ∈ M", "4 ∉ M", "8 ∈ M", "0 ∈ M"],
            2,
            "Số 8 là phần tử nằm trong tập hợp M nên viết 8 ∈ M."
          ),
          q(
            "Theo Bài 6 (tr. 23), viết tích 5² · 5⁴ dưới dạng một lũy thừa là:",
            ["5⁶", "5⁸", "25⁶", "10⁶"],
            0,
            "Nhân hai lũy thừa cùng cơ số: aᵐ · aⁿ = aᵐ⁺ⁿ ⇒ 5² · 5⁴ = 5²⁺⁴ = 5⁶."
          ),
          q(
            "Theo Bài 7 (tr. 25), giá trị của biểu thức 36 : 3² + 2³ · 5 bằng bao nhiêu?",
            ["24", "44", "52", "84"],
            1,
            "Thực hiện lũy thừa trước: 36 : 9 + 8 · 5 = 4 + 40 = 44."
          ),
          q(
            "Theo Bài 9 (tr. 35), số nào sau đây chia hết cho cả 2, 3, 5 và 9?",
            ["1 250", "2 340", "3 425", "4 104"],
            1,
            "2 340 tận cùng là 0 (chia hết cho 2 và 5) và có tổng chữ số 2+3+4+0 = 9 (chia hết cho cả 3 và 9)."
          ),
          q(
            "Theo Bài 10 (tr. 38), khẳng định nào đúng về số 0 và số 1?",
            [
              "Cả 0 và 1 đều là số nguyên tố",
              "1 là số nguyên tố nhỏ nhất",
              "0 và 1 không là số nguyên tố cũng không là hợp số",
              "1 là hợp số vì chỉ có 1 ước",
            ],
            2,
            "Số nguyên tố phải lớn hơn 1 và chỉ có hai ước là 1 và chính nó; hợp số lớn hơn 1 và có nhiều hơn hai ước."
          ),
          q(
            "Theo Bài 10 (tr. 41), phân tích số 60 ra thừa số nguyên tố được kết quả nào?",
            ["2 · 3 · 10", "2² · 3 · 5", "4 · 3 · 5", "2 · 5 · 6"],
            1,
            "60 = 4 · 15 = 2² · 3 · 5 (các thừa số 2, 3, 5 đều là số nguyên tố)."
          ),
          q(
            "Theo Bài 11 (tr. 46), cô giáo chia 24 bút và 36 quyển vở thành nhiều nhất bao nhiêu phần quà giống nhau?",
            ["6 phần", "8 phần", "12 phần", "72 phần"],
            2,
            "Số phần nhiều nhất là ƯCLN(24, 36) = 12 phần; mỗi phần gồm 2 bút và 3 vở."
          ),
          q(
            "Theo Bài 12 (tr. 51), hai bạn An và Bình lần lượt 6 ngày và 8 ngày trực nhật thư viện một lần. Cùng trực hôm nay thì sau ít nhất mấy ngày lại cùng trực?",
            ["14 ngày", "18 ngày", "24 ngày", "48 ngày"],
            2,
            "Số ngày ít nhất là BCNN(6, 8) = 24 ngày."
          ),
        ],
      },
      {
        title: "Chinh phục Số nguyên & Hình phẳng — Chương III, IV, V (KNTT Tập 1)",
        chapterRef: "Chương III, IV & V (tr. 57–110 / PDF 58–111)",
        questions: [
          q(
            "Theo Bài 13 (tr. 59), sắp xếp các số nguyên -12; 5; 0; -3 theo thứ tự tăng dần là:",
            [
              "-3; -12; 0; 5",
              "-12; -3; 0; 5",
              "5; 0; -3; -12",
              "0; -3; 5; -12",
            ],
            1,
            "Trên trục số nằm ngang, -12 ở bên trái -3, tiếp đến 0 rồi đến 5."
          ),
          q(
            "Theo Bài 14 (tr. 63), nhiệt độ ban đêm tại Sa Pa là -2°C, ban ngày tăng thêm 7°C. Nhiệt độ ban ngày là:",
            ["-9°C", "-5°C", "5°C", "9°C"],
            2,
            "Tính (-2) + 7 = +(7 - 2) = 5°C."
          ),
          q(
            "Theo Bài 15 (tr. 67), rút gọn biểu thức 25 - (25 - 17) bằng quy tắc dấu ngoặc:",
            ["-17", "17", "33", "67"],
            1,
            "Bỏ ngoặc có dấu '-' đằng trước phải đổi dấu: 25 - 25 + 17 = 17."
          ),
          q(
            "Theo Bài 16 (tr. 71), tích (-8) · (-6) có kết quả là:",
            ["-48", "-14", "14", "48"],
            3,
            "Tích của hai số nguyên âm là một số nguyên dương: 8 · 6 = 48."
          ),
          q(
            "Theo Bài 17 (tr. 74), tập hợp tất cả các ước nguyên của -6 có bao nhiêu phần tử?",
            ["4 phần tử", "6 phần tử", "8 phần tử", "Vô số"],
            2,
            "Các ước nguyên của -6 gồm cả số dương và số âm: ±1, ±2, ±3, ±6 (gồm 8 ước)."
          ),
          q(
            "Theo Bài 18 (tr. 80), hình lục giác đều được ghép từ mấy hình tam giác đều bằng nhau?",
            ["4 tam giác đều", "5 tam giác đều", "6 tam giác đều", "8 tam giác đều"],
            2,
            "Nối tâm với 6 đỉnh chia hình lục giác đều thành 6 hình tam giác đều bằng nhau."
          ),
          q(
            "Theo Bài 20 (tr. 91–93), một mảnh đất hình thang cân có hai đáy 10 m, 16 m và chiều cao 5 m. Diện tích là:",
            ["65 m²", "130 m²", "80 m²", "52 m²"],
            0,
            "Diện tích hình thang cân: S = (10 + 16) · 5 / 2 = 26 · 5 / 2 = 65 m²."
          ),
          q(
            "Theo Bài 21 & 22 (tr. 99–106), hình nào dưới đây có ĐÚNG 2 trục đối xứng và có tâm đối xứng?",
            ["Hình tam giác đều", "Hình vuông", "Hình thang cân", "Hình thoi (không là hình vuông)"],
            3,
            "Hình thoi không phải hình vuông có đúng 2 trục đối xứng (hai đường chéo) và 1 tâm đối xứng (giao điểm hai đường chéo)."
          ),
        ],
      },
    ],
  },
  {
    id: "ngu-van",
    subjectCode: "VAN6",
    name: "Ngữ văn",
    bookTitle: "Ngữ văn 6 - Tập một",
    bookSeries: "Kết nối tri thức với cuộc sống",
    publisher: "Nhà xuất bản Giáo dục Việt Nam",
    isbn: "978-604-0-25154-1",
    localRelativePath: "SGK/Lop_6/Ngu_van/Tap_1/SGK_Ngu_van_6_Tap_1_KNTT.pdf",
    driveTargetPath:
      "EDUCARE_AI/02_HOC_LIEU/Ngu_van/Lop_6/Tap_1/SGK_Ngu_van_6_Tap_1_KNTT.pdf",
    pageOffset: 1,
    topics: [
      "Bài 1: Tôi và các bạn (tr.10–37 / PDF tr.11–38)",
      "Bài 2: Gõ cửa trái tim (tr.38–58 / PDF tr.39–59)",
      "Bài 3: Yêu thương và chia sẻ (tr.59–87 / PDF tr.60–88)",
      "Bài 4: Quê hương yêu dấu (tr.88–107 / PDF tr.89–108)",
      "Bài 5: Những nẻo đường xứ sở (tr.108–130 / PDF tr.109–131)",
      "Ôn tập Học kì I & Phụ lục thuật ngữ (tr.131–135 / PDF tr.132–136)",
    ],
    chapters: [
      {
        code: "VAN6_B1",
        title: "Bài 1. Tôi và các bạn",
        printPages: "10–37",
        pdfPages: "11–38",
        lessons: [
          "Đọc: Bài học đường đời đầu tiên (Tô Hoài, tr.12)",
          "Thực hành tiếng Việt (Từ đơn, từ phức, từ ghép, từ láy, tr.20, 26)",
          "Đọc: Nếu cậu muốn có một người bạn... (tr.21) & Bắt nạt (tr.27)",
          "Viết: Viết bài văn kể lại một trải nghiệm của em (tr.28)",
          "Nói và nghe, Củng cố mở rộng, Thực hành đọc: Những người bạn (tr.32–37)",
        ],
        objectives:
          "Nhận biết đặc điểm truyện đồng thoại, ngôi kể thứ nhất, lời kể và lời nhân vật; phân biệt từ đơn, từ ghép, từ láy; viết được bài văn kể lại một trải nghiệm theo ngôi thứ nhất.",
        summarySource:
          "SGK Ngữ văn 6 Tập 1 (KNTT), Bài 1 Tôi và các bạn (tr.10–37, PDF 11–38): Truyện đồng thoại 'Bài học đường đời đầu tiên' (Tô Hoài) kể bằng ngôi thứ nhất của Dế Mèn; đoạn trích 'Hoàng tử bé' (Nếu cậu muốn có một người bạn...) nói về ý nghĩa sự 'cảm hóa' trong tình bạn; thơ 'Bắt nạt' (Nguyễn Thế Hoàng Linh); Tiếng Việt: Từ đơn (1 tiếng) và từ phức (≥2 tiếng, gồm từ ghép và từ láy).",
      },
      {
        code: "VAN6_B2",
        title: "Bài 2. Gõ cửa trái tim",
        printPages: "38–58",
        pdfPages: "39–59",
        lessons: [
          "Đọc: Chuyện cổ tích về loài người (Xuân Quỳnh, tr.40)",
          "Thực hành tiếng Việt (So sánh, nhân hóa, điệp ngữ, tr.43, 47)",
          "Đọc: Mây và sóng (Ta-go, tr.44) & Bức tranh của em gái tôi (Tạ Duy Anh, tr.48)",
          "Viết: Viết đoạn văn ghi lại cảm xúc về một bài thơ có yếu tố tự sự và miêu tả (tr.52)",
          "Nói và nghe, Củng cố mở rộng, Thực hành đọc: Những cánh buồm (tr.55–58)",
        ],
        objectives:
          "Nhận biết yếu tố tự sự và miêu tả trong thơ; phân tích tác dụng của phép so sánh, nhân hóa, điệp ngữ; viết đoạn văn nêu cảm xúc về bài thơ có yếu tố tự sự và miêu tả.",
        summarySource:
          "SGK Ngữ văn 6 Tập 1 (KNTT), Bài 2 Gõ cửa trái tim (tr.38–58, PDF 39–59): Thơ 'Chuyện cổ tích về loài người' (Xuân Quỳnh), 'Mây và sóng' (Ta-go) ca ngợi tình yêu thương, sự che chở của gia đình và mẹ dành cho trẻ thơ; truyện 'Bức tranh của em gái tôi' (Tạ Duy Anh) viết về sự hối hận và thức tỉnh trước lòng nhân hậu của em gái Kiều Phương.",
      },
      {
        code: "VAN6_B3",
        title: "Bài 3. Yêu thương và chia sẻ",
        printPages: "59–87",
        pdfPages: "60–88",
        lessons: [
          "Đọc: Cô bé bán diêm (An-đéc-xen, tr.61)",
          "Thực hành tiếng Việt (Cụm danh từ, mở rộng thành phần chính của câu, tr.66, 74)",
          "Đọc: Gió lạnh đầu mùa (Thạch Lam, tr.67) & Con chào mào (Mai Văn Phấn, tr.75)",
          "Viết: Viết bài văn kể lại một trải nghiệm của em (tr.77)",
          "Nói và nghe, Củng cố mở rộng, Thực hành đọc: Lắc-ki thực sự may mắn (tr.82–87)",
        ],
        objectives:
          "Hiểu giá trị lòng nhân ái và sự sẻ chia qua truyện ngắn; nhận biết cấu tạo cụm danh từ và tác dụng mở rộng thành phần chính của câu; viết bài văn kể trải nghiệm hoàn chỉnh.",
        summarySource:
          "SGK Ngữ văn 6 Tập 1 (KNTT), Bài 3 Yêu thương và chia sẻ (tr.59–87, PDF 60–88): 'Cô bé bán diêm' (An-đéc-xen) với sự đối lập giữa hiện thực lạnh giá và mộng tưởng qua các que diêm; 'Gió lạnh đầu mùa' (Thạch Lam) ca ngợi tấm lòng sẻ chia ấm áp của Sơn và chị Lan dành cho bé Hiên; Tiếng Việt: Cụm danh từ gồm 3 phần (phần phụ trước – trung tâm danh từ – phần phụ sau) giúp câu miêu tả cụ thể, sinh động.",
      },
      {
        code: "VAN6_B4",
        title: "Bài 4. Quê hương yêu dấu",
        printPages: "88–107",
        pdfPages: "89–108",
        lessons: [
          "Đọc: Chùm ca dao về quê hương đất nước (tr.90)",
          "Thực hành tiếng Việt (Thơ lục bát, từ đồng âm, từ đa nghĩa, hoán dụ, tr.92, 99)",
          "Đọc: Chuyện cổ nước mình (Lâm Thị Mỹ Dạ, tr.93) & Cây tre Việt Nam (Thép Mới, tr.95)",
          "Viết: Tập làm bài thơ lục bát & Viết đoạn văn cảm xúc về bài thơ lục bát (tr.100–103)",
          "Nói và nghe, Củng cố mở rộng, Thực hành đọc: Hành trình của bầy ong (tr.104–107)",
        ],
        objectives:
          "Nhận biết quy luật vần, thanh, nhịp của thể thơ lục bát (6/8) và lục bát biến thể; phân biệt từ đồng âm với từ đa nghĩa, nhận diện phép ẩn dụ và hoán dụ; tập gieo vần lục bát.",
        summarySource:
          "SGK Ngữ văn 6 Tập 1 (KNTT), Bài 4 Quê hương yêu dấu (tr.88–107, PDF 89–108): Thơ lục bát gồm cặp câu 6–8 tiếng, tiếng thứ 6 câu lục vần với tiếng thứ 6 câu bát (vần lưng), tiếng thứ 8 câu bát vần với tiếng thứ 6 câu lục tiếp theo; thanh điệu tuân thủ B-T-B ở tiếng 2-4-6; phân biệt từ đồng âm (âm giống, nghĩa khác hoàn toàn) với từ đa nghĩa (có nét nghĩa liên quan).",
      },
      {
        code: "VAN6_B5",
        title: "Bài 5. Những nẻo đường xứ sở",
        printPages: "108–130",
        pdfPages: "109–131",
        lessons: [
          "Đọc: Cô Tô (Nguyễn Tuân, tr.110)",
          "Thực hành tiếng Việt (Dấu ngoặc kép, ẩn dụ, nhân hóa, lựa chọn từ ngữ, tr.113, 118)",
          "Đọc: Hang Én (Hà My, tr.114) & Cửu Long Giang ta ơi (Nguyên Hồng, tr.119)",
          "Viết: Viết bài văn tả cảnh sinh hoạt (tr.122)",
          "Nói và nghe, Củng cố mở rộng, Thực hành đọc: Nghìn năm tháp Khương Mỹ (tr.126–130)",
        ],
        objectives:
          "Nhận biết đặc trưng thể kí (du kí), vẻ đẹp thiên nhiên và con người vùng biển đảo, hang động, đồng bằng; nắm công dụng dấu ngoặc kép; viết bài văn tả cảnh sinh hoạt có trình tự và chi tiết giàu hình ảnh.",
        summarySource:
          "SGK Ngữ văn 6 Tập 1 (KNTT), Bài 5 Những nẻo đường xứ sở (tr.108–130, PDF 109–131): Văn bản kí 'Cô Tô' (Nguyễn Tuân) tả bình minh trên đảo Cô Tô sau trận bão và nhịp sống lao động bên giếng nước ngọt; 'Hang Én' (Hà My) ghi lại hành trình khám phá hang động nguyên sơ Quảng Bình; Viết: Bài văn tả cảnh sinh hoạt (3 phần Mở bài – Thân bài – Kết bài, kết hợp quan sát toàn cảnh và cận cảnh).",
      },
      {
        code: "VAN6_HK1",
        title: "Ôn tập Học kì I & Phụ lục thuật ngữ",
        printPages: "131–135",
        pdfPages: "132–136",
        lessons: [
          "Ôn tập Học kì I (tr.131)",
          "Phụ lục 1: Bảng tra cứu thuật ngữ (tr.132)",
          "Phụ lục 2: Giải thích một số thuật ngữ văn học & tiếng Việt (tr.134)",
        ],
        objectives:
          "Hệ thống hóa 3 thể loại/kiểu văn bản trọng tâm (Truyện đồng thoại/ngắn, Thơ lục bát/thơ tự do có yếu tố tự sự miêu tả, Kí) cùng kiến thức Tiếng Việt và 3 kiểu bài Viết HK1.",
        summarySource:
          "SGK Ngữ văn 6 Tập 1 (KNTT), Ôn tập HK1 & Phụ lục (tr.131–135, PDF 132–136): Thuật ngữ cốt lõi gồm ẩn dụ, biện pháp tu từ, cụm danh từ, dấu ngoặc kép, điệp ngữ, hoán dụ, lời người kể chuyện, thơ lục bát, lục bát biến thể, truyện đồng thoại, từ đồng âm, từ đơn, từ ghép, từ láy, từ phức.",
      },
    ],
    lesson: `NGUỒN CHÍNH THỨC: SGK Ngữ văn 6 - Tập một (Bộ Kết nối tri thức với cuộc sống - NXB Giáo dục Việt Nam, ISBN 978-604-0-25154-1)
Quy tắc đối chiếu trang: Trang PDF = Trang sách in + 1 (ví dụ: Bài 1 bắt đầu ở trang in 10 → trang PDF 11).

1. HỆ THỐNG BÀI HỌC TRỌNG TÂM HỌC KÌ I (Bài 1–Bài 5, tr. 10–130 / PDF 11–131)
- Bài 1 — Tôi và các bạn (tr. 10–37): Truyện đồng thoại ('Bài học đường đời đầu tiên' — Tô Hoài), ngôi kể thứ nhất, nhân vật và bài học trưởng thành.
- Bài 2 — Gõ cửa trái tim (tr. 38–58): Thơ có yếu tố tự sự và miêu tả ('Chuyện cổ tích về loài người', 'Mây và sóng'), tình cảm gia đình ('Bức tranh của em gái tôi').
- Bài 3 — Yêu thương và chia sẻ (tr. 59–87): Truyện ngắn hiện thực & cổ tích hiện đại ('Cô bé bán diêm', 'Gió lạnh đầu mùa') ngợi ca lòng nhân ái, sẻ chia.
- Bài 4 — Quê hương yêu dấu (tr. 88–107): Thể thơ lục bát (cặp câu 6–8 tiếng, vần lưng ở tiếng thứ 6 câu bát, luật bằng trắc tiếng 2–4–6), tình yêu quê hương qua ca dao, thơ ('Chuyện cổ nước mình') và kí ('Cây tre Việt Nam').
- Bài 5 — Những nẻo đường xứ sở (tr. 108–130): Thể kí/du kí ('Cô Tô' — Nguyễn Tuân, 'Hang Én' — Hà My) tái hiện vẻ đẹp thiên nhiên và sinh hoạt của con người trên mọi miền đất nước.

2. THỰC HÀNH TIẾNG VIỆT TRỌNG TÂM (Phụ lục 2, tr. 134–135)
- Cấu tạo từ: Từ đơn (1 tiếng) vs Từ phức (≥2 tiếng: từ ghép ghép các tiếng có quan hệ nghĩa; từ láy lặp lại âm/vần).
- Cụm danh từ (Bài 3, tr. 66): Gồm 3 phần (phụ trước – danh từ trung tâm – phụ sau); mở rộng thành phần chính bằng cụm từ giúp câu rõ ý, giàu hình ảnh.
- Phân biệt Từ đồng âm (âm giống hệt, nghĩa khác hẳn) và Từ đa nghĩa (một từ có nghĩa gốc và các nghĩa chuyển liên quan).
- Biện pháp tu từ: So sánh, Nhân hóa, Điệp ngữ, Ẩn dụ (gọi tên dựa trên nét tương đồng), Hoán dụ (gọi tên dựa trên nét gần gũi/gắn bó).

3. BA KIỂU BÀI VIẾT HỌC KÌ I
- Kiểu 1: Kể lại một trải nghiệm của em (Bài 1, 3 — dùng ngôi thứ nhất 'tôi/em', nêu rõ sự việc, chi tiết đáng nhớ và cảm xúc/bài học).
- Kiểu 2: Viết đoạn văn ghi lại cảm xúc về một bài thơ có yếu tố tự sự, miêu tả hoặc bài thơ lục bát (Bài 2, 4).
- Kiểu 3: Viết bài văn tả cảnh sinh hoạt (Bài 5 — quan sát từ bao quát đến cụ thể hoạt động của con người trong không gian thời gian nhất định).`,
    exercise: `BÀI TẬP ÔN LUYỆN THEO BÀI 1–5 — NGỮ VĂN 6 KNTT TẬP 1

1. (Bài 1 — Cấu tạo từ, tr. 20): Phân loại các từ sau vào hai nhóm Từ ghép và Từ láy: "rì rào", "bạn bè", "lung linh", "quê hương", "lấp lánh", "chăm chỉ".
2. (Bài 3 — Cụm danh từ, tr. 66): Xác định trung tâm danh từ và hai phần phụ của cụm danh từ "những chiếc đèn lồng đỏ rực ấy", sau đó đặt một câu mở rộng chủ ngữ bằng cụm danh từ đó.
3. (Bài 4 — Thể thơ lục bát & Từ đa nghĩa, tr. 92–100): Chỉ ra cặp tiếng bắt vần lưng và nhịp ngắt của cặp câu lục bát:
   "Việt Nam đất nước ta ơi / Mênh mông biển lúa đâu trời đẹp hơn"
   và phân biệt từ "chân" trong "chân bàn" với "chân núi" (đa nghĩa hay đồng âm?).
4. (Bài 2 & 5 — Biện pháp tu từ): Đọc ngữ liệu tự biên soạn:
   "Bình minh vừa thức giấc trên bến cá, tiếng sóng vỗ rì rầm trò chuyện cùng những con thuyền gỗ nâu sẫm. Ánh nắng vàng óng như mật ong trải nhẹ lên từng chiếc rổ tre đầy ắp cá bạc."
   Tìm 1 phép nhân hóa, 1 phép so sánh và nêu tác dụng gợi hình, gợi cảm.
5. (Viết — Bài 1 & 3, tr. 28, 77): Viết một đoạn văn (150–200 chữ) bằng ngôi thứ nhất kể lại khoảnh khắc em làm một việc tốt giúp đỡ bạn hoặc người thân và bài học em rút ra.`,
    semester: `ĐỀ CƯƠNG ÔN TẬP HỌC KÌ I — NGỮ VĂN 6 (KẾT NỐI TRI THỨC TẬP 1, TR. 131)

• Buổi 1 — Hệ thống truyện kể (Bài 1, 3): Phân biệt truyện đồng thoại và truyện ngắn; xác định ngôi kể, lời người kể chuyện, lời nhân vật và chi tiết tiêu biểu.
• Buổi 2 — Thơ lục bát & Thơ tự do (Bài 2, 4): Nhận biết vần lưng, thanh bằng – trắc trong thơ lục bát; phát hiện yếu tố tự sự và miêu tả trong thơ.
• Buổi 3 — Kí & Ngữ liệu ngoài SGK (Bài 5): Rèn kĩ năng đọc hiểu văn bản mới theo Công văn 3175/BGDĐT (tìm thông tin tường minh, suy luận chi tiết, nêu thông điệp cá nhân).
• Buổi 4 — Thực hành Tiếng Việt tổng hợp: Luyện nhanh bài tập phân loại từ ghép/từ láy, cụm danh từ, từ đồng âm/đa nghĩa, dấu ngoặc kép, ẩn dụ và hoán dụ.
• Buổi 5 — Luyện viết & tự chấm 90 phút: Thực hành lập dàn ý và viết hoàn chỉnh bài văn kể trải nghiệm hoặc tả cảnh sinh hoạt; đối chiếu bảng kiểm ngôi kể, liên kết đoạn, chính tả.

Checklist tự soát (Theo mục Ôn tập HK1, SGK tr. 131):
[ ] Trả lời đọc hiểu có trích dẫn bằng chứng từ văn bản.
[ ] Không đồng nhất tác giả với người kể chuyện xưng "tôi".
[ ] Bài viết kể trải nghiệm đảm bảo 3 phần và nhất quán ngôi thứ nhất.`,
    exam: `ĐỀ KIỂM TRA THỬ HỌC KÌ I — NGỮ VĂN 6 (THEO CHƯƠNG TRÌNH KNTT TẬP 1)
Thời gian: 90 phút • Thang điểm: 10,0 điểm
Lưu ý: Theo Công văn 3175/BGDĐT, ngữ liệu phần Đọc hiểu là văn bản tự biên soạn mới ngoài SGK nhưng đánh giá đúng kiến thức/kĩ năng Bài 1–5 SGK Ngữ văn 6 KNTT Tập 1.

I. ĐỌC HIỂU (4,0 điểm)
Đọc đoạn trích tự biên soạn sau và thực hiện các yêu cầu:
"Sáng Chủ nhật, khu phố nhỏ bên sông rộn rã hơn thường lệ. Tiếng chổi tre xào xạc quét sạch từng góc sân như những nhịp nhạc vui tai. Tôi cùng bạn Minh đeo găng tay, khom lưng nhặt từng vỏ chai nhựa dọc bờ kè. Gió sớm nhẹ nhàng vuốt ve mái tóc chúng tôi, mang theo mùi phù sa mát lành. Khi chiếc túi thu gom đã đầy, nhìn con đường ven sông sáng bừng dưới nắng mới, lòng tôi dâng lên một niềm tự hào lặng lẽ mà ấm áp."

Câu 1 (0,75 điểm): Đoạn trích được kể theo ngôi thứ mấy? Dựa vào dấu hiệu nào để nhận biết?
Câu 2 (0,75 điểm): Chỉ ra một cụm danh từ trong câu "Nhìn con đường ven sông sáng bừng dưới nắng mới..." hoặc "Tôi cùng bạn Minh đeo găng tay..." và xác định danh từ trung tâm của cụm đó.
Câu 3 (1,5 điểm): Tìm một phép nhân hóa và một phép so sánh trong đoạn trích; phân tích ngắn gọn tác dụng của một trong hai phép tu từ ấy.
Câu 4 (1,0 điểm): Từ câu chuyện nhỏ của nhân vật "tôi" và bạn Minh, em hãy nêu 2 việc làm cụ thể học sinh lớp 6 có thể thực hiện để giữ gìn môi trường nơi mình sống.

II. VIẾT (6,0 điểm)
Hãy viết bài văn (khoảng 400 chữ) kể lại một trải nghiệm đáng nhớ của em (ví dụ: một lần tham gia hoạt động tập thể, giúp đỡ người khác hoặc vượt qua lỗi lầm để trưởng thành).`,
    answers: `HƯỚNG DẪN CHẤM BÀI TẬP & ĐỀ KIỂM TRA THỬ HK1 — NGỮ VĂN 6 KNTT TẬP 1

A. Đáp án Bài tập củng cố:
1. Từ ghép: bạn bè, quê hương, chăm chỉ. Từ láy: rì rào, lung linh, lấp lánh.
2. Cụm danh từ "những chiếc đèn lồng đỏ rực ấy": phần phụ trước ("những chiếc"), danh từ trung tâm ("đèn lồng"), phần phụ sau ("đỏ rực ấy").
3. Vần lưng lục bát chuẩn nối tiếng thứ 6 câu lục ("ơi") với tiếng thứ 6 câu bát ("trời"), thường ngắt nhịp chẵn 2/2/2 hoặc 4/2 ("Việt Nam / đất nước / ta ơi") và 4/4 ("Mênh mông biển lúa / đâu trời đẹp hơn"). Từ "chân" trong "chân bàn" và "chân núi" là từ ĐA NGHĨA (cùng chỉ bộ phận dưới cùng tiếp xúc nền/mặt đất, có mối liên hệ nghĩa).
4. Nhân hóa: "Bình minh vừa thức giấc", "tiếng sóng vỗ rì rầm trò chuyện"; So sánh: "Ánh nắng vàng óng như mật ong". Tác dụng: làm bức tranh thiên nhiên sinh động, gần gũi và gợi cảm giác ấm áp, trù phú.
5. Đoạn văn đúng ngôi thứ nhất, có sự việc – chi tiết cụ thể – bài học cảm xúc rõ ràng, diễn đạt mạch lạc.

B. Hướng dẫn chấm Đề kiểm tra thử HK1 (10,0 điểm):
I. Đọc hiểu (4,0 điểm):
- Câu 1 (0,75 đ): Ngôi thứ nhất (0,5 đ). Dấu hiệu: người kể trực tiếp xưng "tôi" / "chúng tôi" và tham gia vào sự việc (0,25 đ).
- Câu 2 (0,75 đ): Cụm danh từ đúng (VD: "khu phố nhỏ bên sông", "từng vỏ chai nhựa", "con đường ven sông", "chiếc túi thu gom") đạt 0,5 đ; chỉ đúng danh từ trung tâm ("phố/khu phố", "vỏ chai", "con đường", "túi") đạt 0,25 đ.
- Câu 3 (1,5 đ): Nêu đúng phép nhân hóa ("Gió sớm nhẹ nhàng vuốt ve mái tóc chúng tôi" — 0,5 đ) và phép so sánh ("Tiếng chổi tre xào xạc... như những nhịp nhạc vui tai" — 0,5 đ). Phân tích tác dụng gợi không khí lao động hăng say, thiên nhiên thân thiện đồng hành cùng con người (0,5 đ).
- Câu 4 (1,0 đ): Nêu được 2 việc làm thiết thực, phù hợp lứa tuổi học sinh lớp 6 (phân loại rác tại lớp, mang bình nước cá nhân hạn chế chai nhựa, chăm sóc bồn hoa...) (mỗi việc 0,5 đ).

II. Viết (6,0 điểm):
- Đảm bảo bố cục bài văn 3 phần Mở bài – Thân bài – Kết bài, dung lượng khoảng 400 chữ (0,5 đ).
- Xác định đúng ngôi kể thứ nhất nhất quán ("tôi/em") và đối tượng trải nghiệm có ý nghĩa (1,0 đ).
- Triển khai trình tự sự việc hợp lí: giới thiệu hoàn cảnh, diễn biến có chi tiết tả hành động/lời nói/tâm trạng chân thực (3,0 đ).
- Nêu rõ cảm xúc và điều em nhận ra sau trải nghiệm ở Kết bài (0,75 đ).
- Diễn đạt trôi chảy, đúng chính tả, dùng từ và liên kết câu tự nhiên (0,75 đ).`,
    games: [
      {
        title: "Thám tử Truyện & Ngôi kể — Bài 1, 2, 3 (SGK Ngữ văn 6 KNTT Tập 1)",
        chapterRef: "Bài 1, 2 & 3 (tr. 10–87 / PDF 11–88)",
        questions: [
          q(
            "Theo Phụ lục 2 (tr. 135) và Bài 1, đặc điểm nào đúng với 'truyện đồng thoại' như Bài học đường đời đầu tiên?",
            [
              "Chỉ kể về các vị thần cổ xưa",
              "Nhân vật thường là loài vật hoặc đồ vật được nhân hóa",
              "Viết hoàn toàn bằng thể thơ lục bát",
              "Luôn sử dụng ngôi kể thứ ba",
            ],
            1,
            "Truyện đồng thoại sáng tác cho trẻ em, nhân vật thường là loài vật hoặc đồ vật được nhân hóa mang tính cách, tâm lí như con người."
          ),
          q(
            "Văn bản 'Bài học đường đời đầu tiên' (tr. 12) do ai kể chuyện và theo ngôi nào?",
            [
              "Tô Hoài kể theo ngôi thứ ba",
              "Dế Choắt kể theo ngôi thứ nhất",
              "Dế Mèn kể theo ngôi thứ nhất",
              "Chị Cốc kể theo ngôi thứ ba",
            ],
            2,
            "Dế Mèn trực tiếp xưng 'tôi' kể lại quãng đời bồng bột và bài học ân hận của chính mình (ngôi thứ nhất)."
          ),
          q(
            "Trong 'Nếu cậu muốn có một người bạn...' (Bài 1, tr. 21), theo lời con cáo, 'cảm hóa' có nghĩa là gì?",
            [
              "Bắt ép người khác nghe theo ý mình",
              "Tạo ra những mối liên hệ, gắn bó đặc biệt và biết quan tâm nhau",
              "Lẩn trốn khỏi mọi người xung quanh",
              "Chạy đua thi xem ai nhanh hơn",
            ],
            1,
            "Con cáo giải thích 'cảm hóa' là làm cho nhau trở nên duy nhất và gắn bó trong tình bạn đầy trách nhiệm."
          ),
          q(
            "Bài thơ 'Mây và sóng' của Ta-go (Bài 2, tr. 44) mang đặc điểm nổi bật nào của thơ?",
            [
              "Có yếu tố tự sự (kể cuộc trò chuyện) và yếu tố miêu tả giàu tưởng tượng",
              "Chỉ toàn lời bàn luận chính trị",
              "Tuân thủ chặt chẽ luật đường thi 8 câu 7 chữ",
              "Không có hình ảnh thiên nhiên nào",
            ],
            0,
            "Bài thơ kể lại cuộc đối thoại tưởng tượng giữa em bé với người trên mây, trong sóng để tôn vinh tình mẫu tử."
          ),
          q(
            "Trong truyện 'Bức tranh của em gái tôi' (Bài 2, tr. 48), chi tiết người anh nhận ra tấm lòng nhân hậu của Kiều Phương diễn ra khi nào?",
            [
              "Khi em gái mới bắt đầu pha màu vẽ",
              "Khi đứng trước bức tranh đạt giải Nhất vẽ chính mình",
              "Khi Kiều Phương đi thi về muộn",
              "Khi bố mẹ khen em gái học giỏi toán",
            ],
            1,
            "Đứng trước bức tranh 'Anh trai tôi' ở phòng triển lãm, người anh giật mình thấy mình trong mắt em gái thật đẹp đẽ, trong sáng."
          ),
          q(
            "Trong 'Gió lạnh đầu mùa' (Bài 3, tr. 67), hành động nào của Sơn và chị Lan thể hiện tình yêu thương, sẻ chia?",
            [
              "Đóng chặt cửa giữ ấm cho riêng mình",
              "Mang chiếc áo bông cũ của em Duyên tặng cho bé Hiên",
              "Chạy ra chợ mua kẹo cho bạn",
              "Khuyên bé Hiên ở yên trong nhà",
            ],
            1,
            "Sơn và Lan động lòng thương cô bạn nghèo phong phanh giữa gió lạnh nên lén đem chiếc áo bông cũ sang cho Hiên."
          ),
          q(
            "Theo Phụ lục 2 (tr. 135), phát biểu nào ĐÚNG về 'người kể chuyện'?",
            [
              "Luôn trùng khớp hoàn toàn với tiểu sử nhà văn ngoài đời",
              "Là nhân vật do tác giả sáng tạo ra để kể câu chuyện",
              "Chỉ xuất hiện trong văn bản nhật dụng",
              "Bắt buộc phải xưng 'tôi' trong mọi tác phẩm",
            ],
            1,
            "Người kể chuyện là vai kể do tác giả sáng tạo ra để dẫn dắt, kể lại chuỗi sự việc; không đồng nhất máy móc với tác giả."
          ),
          q(
            "Khi viết bài văn 'Kể lại một trải nghiệm của em' (Bài 1 tr. 28 & Bài 3 tr. 77), yếu tố nào KHÔNG thể thiếu?",
            [
              "Chuyển toàn bộ bài sang ngôi thứ ba",
              "Bỏ qua cảm xúc cá nhân để chỉ liệt kê giờ giấc",
              "Dùng ngôi thứ nhất, có diễn biến chi tiết và bài học rút ra",
              "Gắn tên một nhà văn nổi tiếng làm người kể",
            ],
            2,
            "Bài văn kể trải nghiệm yêu cầu nhất quán ngôi thứ nhất, kể rõ hoàn cảnh – diễn biến – chi tiết tiêu biểu và cảm xúc/bài học."
          ),
        ],
      },
      {
        title: "Chinh phục Tiếng Việt & Lục bát — Bài 1–5 (SGK Ngữ văn 6 KNTT Tập 1)",
        chapterRef: "Thực hành Tiếng Việt Bài 1–5 & Phụ lục (tr. 20–135)",
        questions: [
          q(
            "Theo Phụ lục 2 (tr. 135) và Bài 1, cặp từ nào dưới đây thuộc loại TỪ LÁY?",
            ["bàn ghế, sách vở", "xinh xắn, rì rào", "quê hương, đất nước", "nhà cửa, vườn tược"],
            1,
            "Từ láy được cấu tạo bởi các tiếng chỉ có quan hệ với nhau về âm (xinh xắn láy âm x, rì rào láy âm r)."
          ),
          q(
            "Theo Bài 3 (tr. 66), trong cụm danh từ 'ba chú mèo mướp nhỏ nhắn ấy', từ trung tâm là:",
            ["ba chú", "mèo mướp", "nhỏ nhắn", "ấy"],
            1,
            "'ba chú' là phần phụ trước chỉ số lượng/đơn vị, 'mèo mướp' là danh từ trung tâm, 'nhỏ nhắn ấy' là phần phụ sau."
          ),
          q(
            "Theo Phụ lục 2 (tr. 135) và Bài 4, thế nào là TỪ ĐỒNG ÂM?",
            [
              "Các từ có nhiều nghĩa liên quan với một nghĩa gốc",
              "Các từ có hình thức âm thanh giống nhau nhưng nghĩa hoàn toàn khác nhau",
              "Hai tiếng lặp lại giống nhau hoàn toàn",
              "Các từ có nghĩa trái ngược nhau",
            ],
            1,
            "Ví dụ 'đá' (hòn đá) và 'đá' (đá bóng) đọc giống nhau nhưng nghĩa hoàn toàn khác nhau, gọi là từ đồng âm."
          ),
          q(
            "Trong Bài 4 (tr. 99), từ 'quả' trong câu 'Quả tim nhân hậu' so với 'quả cam chín mọng' thể hiện hiện tượng nào?",
            ["Từ láy toàn bộ", "Từ đồng âm ngẫu nhiên", "Từ đa nghĩa (chuyển nghĩa)", "Không phải danh từ"],
            2,
            "'Quả' vốn chỉ bộ phận thực vật, được dùng mở rộng theo nét tương đồng hình dạng nên có nhiều nghĩa liên quan (từ đa nghĩa)."
          ),
          q(
            "Theo Bài 4 (tr. 92 & tr. 135), quy tắc gieo vần chuẩn của cặp câu thơ LỤC BÁT (6/8) là:",
            [
              "Tiếng cuối câu 6 vần với tiếng cuối câu 8",
              "Tiếng thứ 6 câu lục vần với tiếng thứ 6 câu bát",
              "Tiếng thứ 2 câu lục vần với tiếng thứ 4 câu bát",
              "Thơ lục bát không cần gieo vần",
            ],
            1,
            "Trong thể thơ lục bát chuẩn, tiếng thứ 6 của câu 6 tiếng vần với tiếng thứ 6 của câu 8 tiếng; tiếng thứ 8 câu 8 lại vần với tiếng thứ 6 câu 6 tiếp theo."
          ),
          q(
            "Câu thơ 'Áo chàm đưa buổi phân li / Cầm tay nhau biết nói gì hôm nay' (Bài 4) dùng biện pháp nào qua cụm 'Áo chàm'?",
            ["So sánh", "Hoán dụ", "Điệp ngữ", "Nói quá"],
            1,
            "Lấy trang phục quen thuộc ('áo chàm') để chỉ người dân Việt Bắc — dựa vào quan hệ gắn bó gần gũi nên là phép hoán dụ."
          ),
          q(
            "Trong câu 'Thuyền ta lướt nhẹ trên dòng sông trắng lòa ánh nắng, mặt trời tròn xoe như chiếc mâm đồng rực rỡ', biện pháp nào được dùng rõ nhất?",
            ["Ẩn dụ và điệp ngữ", "So sánh (mặt trời ... như chiếc mâm đồng)", "Chỉ có hoán dụ", "Chơi chữ"],
            1,
            "Đối chiếu hai sự vật tương đồng ('mặt trời' với 'chiếc mâm đồng') qua từ so sánh 'như' giúp câu văn giàu hình ảnh."
          ),
          q(
            "Theo Bài 5 (tr. 118), dấu ngoặc kép trong đoạn văn bản thường KHÔNG dùng để làm gì?",
            [
              "Đánh dấu lời dẫn trực tiếp",
              "Đánh dấu từ ngữ được hiểu theo nghĩa đặc biệt hoặc mỉa mai",
              "Đánh dấu tên tác phẩm, tờ báo được trích dẫn",
              "Thay thế hoàn toàn dấu chấm kết thúc mọi câu trần thuật",
            ],
            3,
            "Dấu ngoặc kép dùng để đánh dấu dẫn trực tiếp, tên tác phẩm hoặc nghĩa đặc biệt, không thay dấu chấm hết câu."
          ),
        ],
      },
    ],
  },
];

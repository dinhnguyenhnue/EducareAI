export type PilotInteractionType = "MCQ" | "MATCH" | "ORDER";
export type PilotCognitiveLevel = "REMEMBER" | "UNDERSTAND" | "APPLY";

export interface EnrichedPilotQuestion {
  id: number;
  questionCode: string;
  interactionType: PilotInteractionType;
  cognitiveLevel: PilotCognitiveLevel;
  objective: string;
  sourceRef: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  matchPairs?: Array<{ left: string; right: string }>;
  orderSteps?: string[];
}

export const EXTRA_GRADE6_QUESTIONS: EnrichedPilotQuestion[] = [
  {
    id: 11,
    questionCode: "TIN6-B1-Q11",
    interactionType: "MATCH",
    cognitiveLevel: "UNDERSTAND",
    objective: "Ghép đúng khái niệm Thông tin, Dữ liệu và Vật mang tin (Câu hỏi 1, SGK tr. 7).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 7",
    question:
      "[Ghép cặp] Em hãy ghép mỗi mục ở cột A (1. Thông tin; 2. Dữ liệu; 3. Vật mang tin) với mô tả phù hợp ở cột B.",
    options: [
      "1 - Hiểu biết của con người; 2 - Các số, văn bản, hình ảnh, âm thanh; 3 - Vật chứa dữ liệu",
      "1 - Các số, văn bản; 2 - Vật chứa dữ liệu; 3 - Hiểu biết của con người",
      "1 - Vật chứa dữ liệu; 2 - Hiểu biết của con người; 3 - Các số, văn bản",
      "1 - Hiểu biết của con người; 2 - Vật chứa dữ liệu; 3 - Các số, văn bản",
    ],
    correctIndex: 0,
    explanation:
      "Theo Câu hỏi 1 trang 7 SGK Tin học 6: 1) Thông tin là hiểu biết của con người về thế giới; 2) Dữ liệu là các số, văn bản, hình ảnh, âm thanh...; 3) Vật mang tin là vật chứa dữ liệu.",
    matchPairs: [
      { left: "1) Thông tin", right: "Hiểu biết của con người về thế giới" },
      { left: "2) Dữ liệu", right: "Các số, văn bản, hình ảnh, âm thanh..." },
      { left: "3) Vật mang tin", right: "Vật chứa dữ liệu (giấy, bảng, thẻ nhớ...)" },
    ],
  },
  {
    id: 12,
    questionCode: "TIN6-B1-Q12",
    interactionType: "ORDER",
    cognitiveLevel: "UNDERSTAND",
    objective: "Sắp xếp đúng trình tự bạn Minh thu nhận dữ liệu và quyết định qua đường (Hoạt động 1, SGK tr. 6).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 6",
    question:
      "[Sắp xếp thứ tự] Sắp xếp các bước diễn ra khi bạn Minh đi qua ngã tư có đèn giao thông theo đúng trình tự hợp lí:",
    options: [
      "Quan sát cây đèn giao thông -> Thấy đèn xanh và xe dừng lại (Dữ liệu) -> Biết qua đường an toàn (Thông tin) -> Quyết định bước qua đường",
      "Quyết định bước qua đường -> Quan sát cây đèn -> Thấy đèn xanh -> Biết qua đường an toàn",
      "Biết qua đường an toàn -> Thấy đèn xanh -> Quan sát cây đèn -> Quyết định bước qua đường",
      "Thấy đèn xanh -> Quyết định bước qua đường -> Quan sát cây đèn -> Biết an toàn",
    ],
    correctIndex: 0,
    explanation:
      "Con người quan sát vật mang tin (cây đèn), tiếp nhận dữ liệu (màu đèn xanh, xe dừng), xử lí thành thông tin (biết an toàn) rồi mới đưa ra hành động (qua đường).",
    orderSteps: [
      "Quan sát cây đèn giao thông (Vật mang tin)",
      "Thấy đèn đổi màu xanh và các xe chiều đèn đỏ dừng lại (Dữ liệu)",
      "Hiểu rằng lúc này có thể qua đường an toàn (Thông tin)",
      "Quyết định nhanh chóng bước qua đường (Hành động)",
    ],
  },
  {
    id: 13,
    questionCode: "TIN6-B1-Q13",
    interactionType: "MATCH",
    cognitiveLevel: "APPLY",
    objective: "Phân loại đúng Vật mang tin, Dữ liệu và Thông tin trong tình huống du lịch Đảo Cò (SGK tr. 7).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 7",
    question:
      "[Ghép cặp] Trong ví dụ khu du lịch Đảo Cò (SGK tr. 7), em hãy ghép mỗi yếu tố với vai trò đúng của nó:",
    options: [
      "Tấm bảng gỗ -> Vật mang tin; Dòng chữ '40 000đ, 35 phút' -> Dữ liệu; Biết giá vé và thời gian đi xuồng -> Thông tin",
      "Tấm bảng gỗ -> Dữ liệu; Dòng chữ '40 000đ, 35 phút' -> Thông tin; Biết giá vé -> Vật mang tin",
      "Tấm bảng gỗ -> Thông tin; Dòng chữ -> Vật mang tin; Biết giá vé -> Dữ liệu",
      "Cả ba đều là vật mang tin",
    ],
    correctIndex: 0,
    explanation:
      "Tấm bảng là vật mang tin; các số và chữ viết trên bảng là dữ liệu; sự hiểu biết của du khách về giá vé 40.000đ và hành trình 35 phút là thông tin.",
    matchPairs: [
      { left: "Tấm bảng tại bến tàu", right: "Vật mang tin" },
      { left: "Chữ và số 'Đảo Cò, 40 000đ, 35 phút'", right: "Dữ liệu" },
      { left: "Hiểu giá vé 40.000đ và đi mất 35 phút", right: "Thông tin" },
    ],
  },
  {
    id: 14,
    questionCode: "TIN6-B1-Q14",
    interactionType: "MCQ",
    cognitiveLevel: "REMEMBER",
    objective: "Nhận biết các dạng thể hiện của dữ liệu (SGK tr. 6).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 6",
    question:
      "Khi bạn An xem mục dự báo thời tiết trên ti vi, dữ liệu xuất hiện dưới những dạng nào?",
    options: [
      "Con số, văn bản, hình ảnh và âm thanh",
      "Chỉ có duy nhất dạng văn bản",
      "Chỉ có duy nhất dạng con số",
      "Không có dữ liệu nào xuất hiện",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 6: Trên màn hình ti vi có bảng số nhiệt độ 24–31°C (con số), chữ 'Ít mây, trời nắng' (văn bản), hình đám mây và mặt trời (hình ảnh) cùng lời cô phát thanh viên (âm thanh).",
  },
  {
    id: 15,
    questionCode: "TIN6-B1-Q15",
    interactionType: "MCQ",
    cognitiveLevel: "UNDERSTAND",
    objective: "Hiểu vai trò của bài học lịch sử đem lại hiểu biết cho con người (SGK tr. 7).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 7",
    question:
      "Qua bài học lịch sử về Chiến dịch Điện Biên Phủ (địa điểm, thời gian, diễn biến trận đánh...), em biết được tinh thần dũng cảm của quân và dân ta. Ví dụ này cho thấy điều gì?",
    options: [
      "Thông tin đem lại hiểu biết cho con người",
      "Thông tin chỉ dùng để dự báo thời tiết",
      "Vật mang tin quan trọng hơn thông tin",
      "Dữ liệu không cần con người đọc hiểu",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 7: Bài học lịch sử về Chiến dịch Điện Biên Phủ minh hoạ rằng thông tin đem lại hiểu biết cho con người.",
  },
  {
    id: 16,
    questionCode: "TIN6-B1-Q16",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Vận dụng đặt câu hỏi tìm thông tin chuẩn bị cho buổi dã ngoại (Hoạt động 2, SGK tr. 8).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 8",
    question:
      "Trong Hoạt động 2 (SGK tr. 8), bạn Dung tìm thông tin về thời tiết trước buổi dã ngoại nhằm mục đích gì?",
    options: [
      "Để biết nên mặc quần áo như thế nào cho phù hợp",
      "Để sửa chữa ti vi ở nhà",
      "Để thay đổi lịch sử địa phương",
      "Để xoá dữ liệu trong thẻ nhớ",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 8: Bạn Dung tìm thông tin thời tiết để biết nên mặc quần áo như thế nào cho phù hợp trong buổi dã ngoại.",
  },
  {
    id: 17,
    questionCode: "TIN6-B1-Q17",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Đọc và phân tích Bảng 1.1 Lượng mưa trung bình hàng tháng (Luyện tập, SGK tr. 8).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 8",
    question:
      "Theo Bảng 1.1 (Lượng mưa trung bình hàng tháng ở SGK tr. 8), phát biểu 'Tháng 6, Đà Nẵng ít mưa nhất so với các thành phố khác' là thông tin hay dữ liệu?",
    options: [
      "Là thông tin (vì là nhận xét rút ra sau khi so sánh dữ liệu trong bảng)",
      "Là vật mang tin",
      "Chỉ là một con số ngẫu nhiên",
      "Không liên quan đến bảng số liệu",
    ],
    correctIndex: 0,
    explanation:
      "Các con số trong bảng là dữ liệu; phát biểu so sánh rút ra từ các con số đó đem lại hiểu biết nên là thông tin.",
  },
  {
    id: 18,
    questionCode: "TIN6-B1-Q18",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Khai thác thông tin từ Bảng 1.1 để phục vụ quyết định thực tế (Luyện tập d, SGK tr. 8).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 8",
    question:
      "Biết được Huế mưa nhiều nhất vào tháng 10, tháng 11 và ít mưa nhất vào tháng 3 có ảnh hưởng gì đến việc lựa chọn thời gian đi du lịch Huế?",
    options: [
      "Giúp du khách chọn tháng ít mưa để đi lại, tham quan thuận lợi hơn",
      "Không có bất kì tác dụng nào khi chuẩn bị chuyến đi",
      "Làm thay đổi vị trí địa lí của thành phố Huế",
      "Biến giấy viết thành thẻ nhớ",
    ],
    correctIndex: 0,
    explanation:
      "Thông tin đúng giúp con người đưa ra những lựa chọn tốt (chọn thời điểm du lịch thuận lợi, chuẩn bị trang phục phù hợp).",
  },
  {
    id: 19,
    questionCode: "TIN6-B1-Q19",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Nêu được ví dụ về vật mang tin phục vụ học tập (Vận dụng 2, SGK tr. 8).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 8",
    question:
      "Trong lớp học, phương tiện nào dưới đây đóng vai trò là vật mang tin giúp lưu trữ bài ghi của học sinh?",
    options: [
      "Quyển vở ghi bài của học sinh",
      "Ánh sáng mặt trời chiếu qua cửa sổ",
      "Chiếc quạt trần đang quay",
      "Cảm giác vui vẻ khi ra chơi",
    ],
    correctIndex: 0,
    explanation:
      "Quyển vở ghi bài lưu trữ các dòng chữ, con số, hình vẽ nên là vật mang tin giúp ích trực tiếp cho việc học tập.",
  },
  {
    id: 20,
    questionCode: "TIN6-B1-Q20",
    interactionType: "ORDER",
    cognitiveLevel: "APPLY",
    objective: "Sắp xếp chu trình chuyển đổi từ thông tin cần truyền đạt sang dữ liệu trên vật mang tin (SGK tr. 7).",
    sourceRef: "SGK Tin học 6 KNTT, tr. 7",
    question:
      "[Sắp xếp thứ tự] Sắp xếp các bước khi trung tâm du lịch Đảo Cò truyền đạt thông tin giá vé cho khách tham quan:",
    options: [
      "Có thông tin về giá vé & thời gian -> Viết thành chữ và số (Dữ liệu) lên tấm bảng gỗ (Vật mang tin) -> Du khách đọc bảng và hiểu được thông tin",
      "Du khách đọc bảng -> Có thông tin -> Viết lên tấm bảng gỗ",
      "Viết lên bảng gỗ -> Chưa có thông tin -> Du khách không đọc",
      "Tấm bảng tự sinh ra thông tin -> Du khách viết lại",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 7: Thông tin cần truyền đạt được ghi lên vật mang tin trở thành dữ liệu; người đọc tiếp nhận dữ liệu đó để hiểu được thông tin.",
    orderSteps: [
      "Trung tâm du lịch có thông tin cần thông báo (giá vé 40.000đ, đi 35 phút)",
      "Ghi thông tin thành chữ và số (Dữ liệu) lên tấm bảng (Vật mang tin)",
      "Du khách nhìn thấy các chữ và số trên tấm bảng",
      "Du khách hiểu được giá vé và thời gian hành trình (Thông tin)",
    ],
  },
];

export const EXTRA_GRADE7_QUESTIONS: EnrichedPilotQuestion[] = [
  {
    id: 11,
    questionCode: "TIN7-B1-Q11",
    interactionType: "MATCH",
    cognitiveLevel: "UNDERSTAND",
    objective: "Phân loại đúng Thiết bị vào, Thiết bị ra và Thiết bị vừa vào vừa ra (SGK tr. 5–7).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 5–7",
    question:
      "[Ghép cặp] Em hãy ghép mỗi thiết bị ở cột A với nhóm chức năng đúng ở cột B:",
    options: [
      "Bàn phím, chuột -> Thiết bị vào; Máy chiếu, máy in -> Thiết bị ra; Màn hình cảm ứng -> Vừa vào vừa ra",
      "Bàn phím -> Thiết bị ra; Máy chiếu -> Thiết bị vào; Màn hình cảm ứng -> Chỉ là thiết bị lưu trữ",
      "Máy chiếu -> Vừa vào vừa ra; Bàn phím -> Thiết bị ra; Chuột -> Thiết bị ra",
      "Tất cả đều chỉ là thiết bị ra",
    ],
    correctIndex: 0,
    explanation:
      "Bàn phím, chuột nhập thông tin vào máy tính (vào); máy chiếu, máy in xuất thông tin ra ngoài (ra); màn hình cảm ứng vừa hiển thị vừa nhận chạm tay (vừa vào vừa ra).",
    matchPairs: [
      { left: "Bàn phím và chuột máy tính", right: "Thiết bị vào (Input)" },
      { left: "Máy chiếu và máy in", right: "Thiết bị ra (Output)" },
      { left: "Màn hình cảm ứng (Touch screen)", right: "Thiết bị vừa vào vừa ra" },
    ],
  },
  {
    id: 12,
    questionCode: "TIN7-B1-Q12",
    interactionType: "ORDER",
    cognitiveLevel: "APPLY",
    objective: "Sắp xếp đúng thứ tự tắt máy tính an toàn khi đang mở tệp trên thẻ nhớ (Luyện tập 2, SGK tr. 9).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 9",
    question:
      "[Sắp xếp thứ tự] Máy tính đang làm việc với một tệp trên thẻ nhớ. Em hãy sắp xếp lại thứ tự đúng để tắt máy an toàn, không làm mất dữ liệu:",
    options: [
      "Lưu lại nội dung tệp -> Đóng tệp đang mở trên thẻ nhớ -> Chọn 'Safe To Remove Hardware' -> Chọn nút lệnh Shut down",
      "Chọn Shut down -> Lưu lại nội dung tệp -> Đóng tệp -> Safe To Remove Hardware",
      "Safe To Remove Hardware -> Lưu tệp -> Đóng tệp -> Shut down",
      "Đóng tệp -> Rút thẻ nhớ ngay -> Lưu tệp -> Shut down",
    ],
    correctIndex: 0,
    explanation:
      "Luyện tập 2 (SGK tr. 9): Phải lưu nội dung tệp (d) -> đóng tệp đang mở (b) -> chọn Safe To Remove Hardware để ngắt thẻ nhớ (c) -> chọn Shut down để tắt máy (a).",
    orderSteps: [
      "d) Lưu lại nội dung của tệp",
      "b) Đóng tệp đang mở trên thẻ nhớ",
      "c) Chọn 'Safe To Remove Hardware' để ngắt kết nối với thẻ nhớ",
      "a) Chọn nút lệnh Shut down để tắt máy tính",
    ],
  },
  {
    id: 13,
    questionCode: "TIN7-B1-Q13",
    interactionType: "MATCH",
    cognitiveLevel: "APPLY",
    objective: "Phân biệt việc Nên làm và Không nên làm khi sử dụng máy tính (Bảng 1.1, SGK tr. 9).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 9",
    question:
      "[Ghép cặp] Dựa vào Bảng 1.1 (SGK tr. 9), hãy ghép mỗi hành động với quy tắc An toàn thiết bị tương ứng:",
    options: [
      "Giữ bàn tay khô, sạch -> Nên làm; Dùng vật sắc nhọn chạm màn hình -> Không nên làm; Rút điện trước khi lau dọn máy -> Nên làm",
      "Giữ tay khô -> Không nên làm; Dùng vật sắc nhọn chạm màn hình -> Nên làm; Rút điện trước khi lau -> Không nên làm",
      "Để đồ uống gần bàn phím -> Nên làm; Tắt máy bằng Shut down -> Không nên làm",
      "Chạm vào phần kim loại của máy đang bật -> Nên làm",
    ],
    correctIndex: 0,
    explanation:
      "Bảng 1.1 (SGK tr. 9): Giữ tay khô sạch và rút điện trước khi lau dọn là việc Nên làm; tác động lên màn hình bằng vật sắc nhọn là việc Không nên làm.",
    matchPairs: [
      { left: "Giữ bàn tay khô, sạch khi dùng máy tính", right: "Việc NÊN LÀM" },
      { left: "Tác động lên màn hình bằng vật sắc, nhọn", right: "Việc KHÔNG NÊN LÀM" },
      { left: "Rút điện trước khi lau, dọn máy tính", right: "Việc NÊN LÀM" },
    ],
  },
  {
    id: 14,
    questionCode: "TIN7-B1-Q14",
    interactionType: "MCQ",
    cognitiveLevel: "REMEMBER",
    objective: "Nhận biết chức năng của tấm cảm ứng touchpad trên laptop (SGK tr. 7).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 7",
    question:
      "Tấm cảm ứng (touchpad) chiếm một vùng trên bàn phím máy tính xách tay có chức năng giống như thiết bị nào?",
    options: [
      "Chuột máy tính thông thường",
      "Máy in văn bản",
      "Loa phát nhạc",
      "Máy chiếu lớp học",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 7: Tấm cảm ứng (touchpad) nhận biết vị trí và sự di chuyển của ngón tay người dùng, có chức năng giống như chuột máy tính thông thường.",
  },
  {
    id: 15,
    questionCode: "TIN7-B1-Q15",
    interactionType: "MCQ",
    cognitiveLevel: "UNDERSTAND",
    objective: "Hiểu đặc điểm mở rộng của loa thông minh (Hình 1.4a, SGK tr. 7).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 7",
    question:
      "Vì sao loa thông minh (Hình 1.4a) không chỉ là thiết bị ra đơn thuần?",
    options: [
      "Vì nó có thể kết nối không dây với máy tính/Internet, nhận lệnh bằng giọng nói (hỏi giờ, thời tiết...) và trả lời bằng giọng nói",
      "Vì nó chỉ dùng để in tài liệu ra giấy",
      "Vì nó không cần dùng điện",
      "Vì nó là một chiếc bàn phím cơ",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 7: Loa thông minh có kết nối không dây, nhận lệnh bằng giọng nói của người dùng và trả lời lại bằng giọng nói.",
  },
  {
    id: 16,
    questionCode: "TIN7-B1-Q16",
    interactionType: "MCQ",
    cognitiveLevel: "UNDERSTAND",
    objective: "Nhận biết khả năng của máy ghi hình kĩ thuật số (Hình 1.4b, SGK tr. 7).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 7",
    question:
      "Ngoài chức năng là thiết bị vào thu hình ảnh/video, chiếc máy ảnh hay máy ghi hình kĩ thuật số còn thực hiện được chức năng nào?",
    options: [
      "Lưu trữ và thực hiện một số chức năng xử lí ảnh, xử lí video đơn giản",
      "Thay thế hoàn toàn nguồn điện của phòng máy",
      "In giấy khổ A4 trực tiếp",
      "Chỉ thu được âm thanh mà không có hình ảnh",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 7: Máy ảnh/máy ghi hình kĩ thuật số không chỉ là thiết bị vào mà còn có thể lưu trữ và thực hiện một số chức năng xử lí ảnh, xử lí video đơn giản.",
  },
  {
    id: 17,
    questionCode: "TIN7-B1-Q17",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Nhận biết hậu quả khi cắm sai cổng kết nối tai nghe và micro (Hoạt động 3, SGK tr. 8).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 8",
    question:
      "Trên thùng máy tính để bàn có cổng tai nghe (biểu tượng tai nghe) và cổng micro (biểu tượng micro). Nếu em cắm nhầm đầu nối tai nghe vào cổng micro thì điều gì xảy ra?",
    options: [
      "Em sẽ không nghe thấy âm thanh từ máy tính và có thể tưởng nhầm rằng thiết bị hoạt động không tốt",
      "Tai nghe sẽ tự động biến thành màn hình",
      "Máy tính sẽ chạy nhanh gấp đôi",
      "Máy in sẽ tự động in tài liệu",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 8: Nếu cắm đầu nối tai nghe vào cổng micro (cổng 5 thay vì cổng 4), em sẽ không nghe thấy âm thanh từ máy tính.",
  },
  {
    id: 18,
    questionCode: "TIN7-B1-Q18",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Hiểu tác hại của việc cố gắng cắm sai đầu nối vào cổng kết nối (SGK tr. 8).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 8",
    question:
      "Vì sao không được cố gắng ấn mạnh khi thấy đầu nối cáp màn hình hoặc USB không khớp với cổng kết nối?",
    options: [
      "Có thể làm gãy chân cắm, hỏng đầu nối hoặc gây chập điện làm hỏng thiết bị",
      "Vì cắm nhầm cổng vẫn hoạt động bình thường",
      "Vì màn hình không cần dây cáp tín hiệu",
      "Vì cổng mạng LAN dùng chung được với dây nguồn",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 8: Mỗi cổng kết nối có hình dạng chuẩn riêng; nếu cắm nhầm và cố ấn mạnh sẽ làm hỏng đầu nối hoặc gây chập điện.",
  },
  {
    id: 19,
    questionCode: "TIN7-B1-Q19",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Giải thích tình huống thực tế với camera an ninh (Vận dụng 1, SGK tr. 9).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 9",
    question:
      "Trên màn hình theo dõi, em thấy một người đứng trước camera an ninh. Người đó có nhìn thấy em qua chiếc camera đó không?",
    options: [
      "Không, vì camera an ninh là thiết bị vào chỉ thu hình ảnh gửi về máy tính chứ không hiển thị hình ảnh ra ngoài",
      "Có, vì camera an ninh là một chiếc máy chiếu",
      "Có, vì mọi camera đều có màn hình lớn phía trước",
      "Không, vì camera chỉ thu được văn bản",
    ],
    correctIndex: 0,
    explanation:
      "Vận dụng 1 (SGK tr. 9): Camera an ninh đóng vai trò thiết bị vào (thu nhận hình ảnh truyền về hệ thống giám sát), không phải thiết bị hiển thị hình ảnh của người xem ra ngoài.",
  },
  {
    id: 20,
    questionCode: "TIN7-B1-Q20",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Biết quy tắc an toàn khi kết nối máy tính với máy in (Bảng 1.1, SGK tr. 9).",
    sourceRef: "SGK Tin học 7 KNTT, tr. 9",
    question:
      "Theo Bảng 1.1 (SGK tr. 9), thao tác nào sau đây cần TRÁNH khi kết nối máy tính với máy in?",
    options: [
      "Nối máy tính với máy in khi một trong hai máy đang bật nguồn",
      "Đọc kĩ hướng dẫn trước khi sử dụng thiết bị",
      "Đóng mọi tài liệu và ứng dụng trước khi tắt máy tính",
      "Gõ phím dứt khoát nhưng nhẹ nhàng",
    ],
    correctIndex: 0,
    explanation:
      "Bảng 1.1 (SGK tr. 9): Không nên nối máy tính với máy in khi một trong hai máy đang bật nguồn để tránh xung điện gây hỏng cổng giao tiếp.",
  },
];

export const EXTRA_GRADE8_QUESTIONS: EnrichedPilotQuestion[] = [
  {
    id: 11,
    questionCode: "TIN8-B1-Q11",
    interactionType: "MATCH",
    cognitiveLevel: "UNDERSTAND",
    objective: "Ghép đúng các thế hệ máy tính điện tử với thành phần điện tử chính (SGK tr. 7–8).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 7–8",
    question:
      "[Ghép cặp] Em hãy ghép mỗi thế hệ máy tính điện tử ở cột A với linh kiện điện tử đặc trưng ở cột B:",
    options: [
      "Thế hệ 1 -> Đèn điện tử chân không; Thế hệ 2 -> Bóng bán dẫn; Thế hệ 3 -> Mạch tích hợp (IC)",
      "Thế hệ 1 -> Bóng bán dẫn; Thế hệ 2 -> Mạch tích hợp IC; Thế hệ 3 -> Đèn điện tử chân không",
      "Thế hệ 1 -> Vi xử lí VLSI; Thế hệ 2 -> Đèn chân không; Thế hệ 3 -> Bóng bán dẫn",
      "Cả ba thế hệ đều dùng mạch tích hợp cỡ siêu lớn ULSI",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 7–8: Thế hệ 1 (1945–1955) dùng đèn điện tử chân không; Thế hệ 2 (1955–1965) dùng bóng bán dẫn; Thế hệ 3 (1965–1974) dùng mạch tích hợp (IC).",
    matchPairs: [
      { left: "Thế hệ thứ nhất (1945–1955)", right: "Đèn điện tử chân không" },
      { left: "Thế hệ thứ hai (1955–1965)", right: "Bóng bán dẫn (Transistor)" },
      { left: "Thế hệ thứ ba (1965–1974)", right: "Mạch tích hợp (IC)" },
    ],
  },
  {
    id: 12,
    questionCode: "TIN8-B1-Q12",
    interactionType: "ORDER",
    cognitiveLevel: "UNDERSTAND",
    objective: "Sắp xếp đúng trình tự lịch sử ra đời các công cụ và máy tính theo dòng thời gian (SGK tr. 5–8).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 5–8",
    question:
      "[Sắp xếp thứ tự] Sắp xếp các mốc phát triển của công cụ tính toán theo thứ tự thời gian từ xưa đến nay:",
    options: [
      "Bàn tính (>2000 năm TCN) -> Máy tính cơ khí Pascaline (1642) -> Máy tính điện – cơ Harvard Mark I (1943–1944) -> Máy tính điện tử 5 thế hệ (1945–nay)",
      "Máy tính cơ khí Pascaline -> Bàn tính -> Máy tính điện tử -> Máy tính điện – cơ",
      "Harvard Mark I -> Pascaline -> Bàn tính -> Máy tính điện tử",
      "Máy tính điện tử -> Harvard Mark I -> Pascaline -> Bàn tính",
    ],
    correctIndex: 0,
    explanation:
      "Dòng thời gian chuẩn trong SGK Tin học 8 tr. 5–8: Bàn tính cổ đại -> Máy tính cơ khí Pascaline (1642) -> Máy tính điện – cơ Harvard Mark I (1943–1944) -> Máy tính điện tử (từ 1945 đến nay).",
    orderSteps: [
      "Bàn tính (Hơn 2000 năm trước Công nguyên)",
      "Chiếc máy tính cơ khí đầu tiên Pascaline (Năm 1642)",
      "Máy tính điện – cơ Harvard Mark I (Năm 1943–1944)",
      "Máy tính điện tử theo kiến trúc Von Neumann (Từ 1945 đến nay)",
    ],
  },
  {
    id: 13,
    questionCode: "TIN8-B1-Q13",
    interactionType: "MATCH",
    cognitiveLevel: "UNDERSTAND",
    objective: "Ghép đúng các nhà khoa học với đóng góp lịch sử của họ trong ngành máy tính (SGK tr. 5–6).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 5–6",
    question:
      "[Ghép cặp] Em hãy ghép tên mỗi nhà khoa học ở cột A với đóng góp nổi bật của họ ở cột B:",
    options: [
      "Blaise Pascal -> Máy tính cơ khí Pascaline (1642); Gottfried Leibniz -> Cải tiến thêm phép nhân, chia; John Von Neumann -> Nguyên lí chương trình được lưu trữ (1945)",
      "Blaise Pascal -> Chương trình lưu trữ; Leibniz -> Máy ENIAC; Von Neumann -> Bàn tính",
      "Pascal -> Thêm phép nhân chia; Leibniz -> Chế tạo Pascaline; Von Neumann -> Sáng chế bóng bán dẫn",
      "Cả ba đều chế tạo máy tính thế hệ thứ năm",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 5–6: Blaise Pascal sáng chế Pascaline (1642); Gottfried Leibniz cải tiến thêm phép nhân, chia; John Von Neumann đề xuất kiến trúc 'chương trình được lưu trữ' (1945).",
    matchPairs: [
      { left: "Blaise Pascal (1642)", right: "Sáng chế máy tính cơ khí Pascaline giúp cha tính thuế" },
      { left: "Gottfried Leibniz", right: "Cải tiến máy Pascal để thực hiện cả bốn phép tính (+, -, ×, :)" },
      { left: "John Von Neumann (1945)", right: "Trình bày nguyên lí 'chương trình được lưu trữ'" },
    ],
  },
  {
    id: 14,
    questionCode: "TIN8-B1-Q14",
    interactionType: "MCQ",
    cognitiveLevel: "REMEMBER",
    objective: "Nhận biết đóng góp của Claude Shannon với các rơ le điện cơ (SGK tr. 6).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 6",
    question:
      "Năm 24 tuổi, nhà khoa học Claude Shannon đã chỉ ra điều gì làm nền tảng cho thiết kế máy tính kĩ thuật số hiện đại?",
    options: [
      "Có thể sử dụng các rơ le để thực hiện các thao tác tính toán trên các dãy bit",
      "Chỉ có bánh răng bằng gỗ mới tính được phép cộng",
      "Máy tính không cần bộ nhớ",
      "Không thể biểu diễn số bằng điện",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 6: Claude Shannon chỉ ra rằng có thể sử dụng các rơ le để thực hiện các thao tác tính toán trên các dãy bit.",
  },
  {
    id: 15,
    questionCode: "TIN8-B1-Q15",
    interactionType: "MCQ",
    cognitiveLevel: "UNDERSTAND",
    objective: "Hiểu đặc điểm của máy tính điện – cơ Harvard Mark I (ASCC) (SGK tr. 6).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 6",
    question:
      "Chiếc máy tính điều khiển tuần tự tự động ASCC (Harvard Mark I, 1943–1944) do Howard Aiken chế tạo thuộc loại máy tính nào?",
    options: [
      "Máy tính điện – cơ (dựa trên các rơ le)",
      "Máy tính thế hệ thứ năm dùng ULSI",
      "Máy tính cá nhân xách tay",
      "Điện thoại thông minh",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 6: Harvard Mark I (ASCC) là máy tính điện – cơ đa năng, thực hiện phép cộng mất gần 1 giây và phép nhân mất khoảng 6 giây.",
  },
  {
    id: 16,
    questionCode: "TIN8-B1-Q16",
    interactionType: "MCQ",
    cognitiveLevel: "REMEMBER",
    objective: "Nhận diện các thành phần trong sơ đồ cấu trúc máy tính Von Neumann (Hình 1.3, SGK tr. 7).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 7",
    question:
      "Theo sơ đồ cấu trúc máy tính dựa trên kiến trúc Von Neumann (Hình 1.3, SGK tr. 7), máy tính gồm những bộ phận chính nào?",
    options: [
      "Thiết bị vào, Bộ xử lí, Bộ nhớ và Thiết bị ra",
      "Chỉ có Bàn phím và Màn hình",
      "Chỉ có Bánh răng và Trống từ",
      "Chỉ có Loa và Máy in",
    ],
    correctIndex: 0,
    explanation:
      "Hình 1.3 (SGK tr. 7): Kiến trúc Von Neumann gồm Bộ xử lí, Bộ nhớ, các cổng kết nối với Thiết bị vào – Thiết bị ra và đường truyền giữa các bộ phận đó.",
  },
  {
    id: 17,
    questionCode: "TIN8-B1-Q17",
    interactionType: "MCQ",
    cognitiveLevel: "REMEMBER",
    objective: "Biết các ví dụ máy tính tiêu biểu của từng thế hệ (SGK tr. 7–8).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 7–8",
    question:
      "Các dòng máy IBM PC, Apple II, Apple Macintosh và chiếc Micral (1973) là ví dụ tiêu biểu của thế hệ máy tính điện tử nào?",
    options: [
      "Thế hệ thứ tư (1974–1990) - Máy vi tính dùng bộ vi xử lí",
      "Thế hệ thứ nhất (1945–1955)",
      "Thế hệ thứ hai (1955–1965)",
      "Máy tính cơ khí thế kỉ XVII",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 8: Máy tính dựa trên công nghệ vi xử lí (VLSI) ở thế hệ thứ tư được gọi là máy vi tính, ví dụ: Micral (1973), IBM PC, Apple II, Apple Macintosh...",
  },
  {
    id: 18,
    questionCode: "TIN8-B1-Q18",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Vận dụng kiến thức lịch sử máy tính tại Việt Nam trước năm 1975 (Vận dụng 1, SGK tr. 9).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 7 & tr. 9",
    question:
      "Tính đến thời điểm đất nước hoàn toàn thống nhất năm 1975, những thế hệ máy tính điện tử nào đã xuất hiện ở nước ta (theo thông tin trong SGK tr. 7)?",
    options: [
      "Thế hệ thứ hai (máy MINSK 22 năm 1968) và Thế hệ thứ ba (máy IBM System/360 năm 1967)",
      "Chỉ có máy tính cơ khí Pascaline",
      "Đã có điện thoại thông minh thế hệ thứ năm",
      "Chưa có bất kì chiếc máy tính điện tử nào",
    ],
    correctIndex: 0,
    explanation:
      "Đối chiếu SGK tr. 7: Năm 1967 máy tính thế hệ thứ ba (IBM System/360) được đưa vào miền Nam và năm 1968 máy tính thế hệ thứ hai (MINSK 22) được đưa vào miền Bắc nước ta.",
  },
  {
    id: 19,
    questionCode: "TIN8-B1-Q19",
    interactionType: "MCQ",
    cognitiveLevel: "APPLY",
    objective: "Nêu được tác động của máy tính trong lĩnh vực y tế và giáo dục (Mục 3, SGK tr. 9).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 9",
    question:
      "Theo SGK Tin học 8 (tr. 9), thiết bị nhỏ gọn nào giúp theo dõi sức khoẻ thường xuyên, phát hiện kịp thời hiện tượng bất thường của cơ thể và tự động thông báo đến người thân hoặc cơ sở y tế?",
    options: [
      "Đồng hồ thông minh (Smartwatch)",
      "Máy tính cơ khí Pascaline",
      "Máy đọc thẻ đục lỗ thế hệ thứ nhất",
      "Bàn tính gảy cổ đại",
    ],
    correctIndex: 0,
    explanation:
      "SGK tr. 9: Trong lĩnh vực y tế, những thiết bị nhỏ gọn như đồng hồ thông minh có thể theo dõi sức khoẻ thường xuyên và cảnh báo kịp thời.",
  },
  {
    id: 20,
    questionCode: "TIN8-B1-Q20",
    interactionType: "ORDER",
    cognitiveLevel: "UNDERSTAND",
    objective: "Sắp xếp đúng thứ tự 5 thế hệ máy tính điện tử theo công nghệ linh kiện (SGK tr. 7–8).",
    sourceRef: "SGK Tin học 8 KNTT, tr. 7–8",
    question:
      "[Sắp xếp thứ tự] Sắp xếp 4 giai đoạn công nghệ linh kiện của máy tính điện tử theo đúng trình tự từ thế hệ trước đến thế hệ sau:",
    options: [
      "Đèn điện tử chân không -> Bóng bán dẫn -> Mạch tích hợp (IC) -> Mạch tích hợp cỡ rất lớn (VLSI) & Сиêu lớn (ULSI)",
      "Bóng bán dẫn -> Đèn điện tử chân không -> VLSI -> Mạch tích hợp (IC)",
      "Mạch tích hợp (IC) -> Bóng bán dẫn -> Đèn chân không -> VLSI",
      "VLSI -> IC -> Bóng bán dẫn -> Đèn điện tử chân không",
    ],
    correctIndex: 0,
    explanation:
      "5 thế hệ máy tính điện tử phát triển theo tiến bộ thu nhỏ linh kiện: Đèn điện tử chân không (TH1) -> Bóng bán dẫn (TH2) -> Mạch tích hợp IC (TH3) -> VLSI (TH4) -> ULSI & AI (TH5).",
    orderSteps: [
      "Thế hệ 1 (1945–1955): Đèn điện tử chân không (ENIAC)",
      "Thế hệ 2 (1955–1965): Bóng bán dẫn (IBM 7090, MINSK 22)",
      "Thế hệ 3 (1965–1974): Mạch tích hợp IC (IBM System/360)",
      "Thế hệ 4 & 5 (1974–nay): VLSI (Vi xử lí) và ULSI kèm Trí tuệ nhân tạo",
    ],
  },
];

import {
  EXTRA_GRADE6_QUESTIONS,
  EXTRA_GRADE7_QUESTIONS,
  EXTRA_GRADE8_QUESTIONS,
  type PilotInteractionType,
  type PilotCognitiveLevel,
} from "./pilot-questions-bank";

export interface PilotPracticeItem {
  id: string;
  question: string;
  answer: string;
  explanation: string;
}

export interface PilotGameQuestion {
  id: number;
  questionCode?: string;
  interactionType?: PilotInteractionType;
  cognitiveLevel?: PilotCognitiveLevel;
  objective?: string;
  sourceRef?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  matchPairs?: Array<{ left: string; right: string }>;
  orderSteps?: string[];
}

export interface PilotGemLink {
  subject: string;
  title: string;
  description: string;
  url: string;
}

export interface PilotGradeModule {
  grade: 6 | 7 | 8;
  label: string;
  subject: string;
  bookSeries: string;
  bookTitle: string;
  chapterTitle: string;
  lessonTitle: string;
  sourcePages: string;
  sourceVerified: boolean;
  startupQuestion: string;
  objectives: string[];
  knowledgeSections: Array<{
    heading: string;
    paragraphs: string[];
    highlightBox?: string[];
  }>;
  examples: Array<{
    title: string;
    content: string;
  }>;
  keyTakeaways: string[];
  practiceItems: PilotPracticeItem[];
  applicationTasks: Array<{
    task: string;
    hint: string;
  }>;
  illustrationCaption: string;
  illustrationNodes: Array<{
    step: string;
    title: string;
    detail: string;
  }>;
  game: {
    title: string;
    objective: string;
    questions: PilotGameQuestion[];
  };
  geminiGems: PilotGemLink[];
  missingSourceNote?: string;
}

export const GRADE6_GEMINI_GEMS: PilotGemLink[] = [
  {
    subject: "Toán 6",
    title: "Gia sư Toán 6",
    description:
      "Hỗ trợ giải thích bài học Toán 6, gợi mở từng bước làm bài tập số học và hình học trực quan.",
    url: "https://gemini.google.com/gem/1PKLRoijfUfwDTaphAS3Z5Cp6myY6oHjH?usp=sharing",
  },
  {
    subject: "Ngữ văn 6",
    title: "Gia sư Ngữ văn 6",
    description:
      "Đồng hành đọc hiểu văn bản, phân tích nhân vật, luyện viết đoạn văn và hoàn thiện câu trả lời Ngữ văn 6.",
    url: "https://gemini.google.com/gem/1wiR7gayxW1di8utJ6W5pemqKZTF6_TZq?usp=sharing",
  },
  {
    subject: "Tin học 6",
    title: "Gia sư Tin học 6",
    description:
      "Giải đáp kiến thức Tin học 6 theo từng bài, hướng dẫn phân biệt khái niệm và thực hành an toàn số.",
    url: "https://gemini.google.com/gem/1OQWZbbNYX0Rd31rxR4GSFnaZBFp_25UT?usp=sharing",
  },
];

export const PILOT_CURRICULUM: Record<6 | 7 | 8, PilotGradeModule> = {
  6: {
    grade: 6,
    label: "Khối 6 (Lớp 6A1)",
    subject: "Tin học",
    bookSeries: "Kết nối tri thức với cuộc sống",
    bookTitle: "SGK Tin học 6",
    chapterTitle: "Chủ đề 1. Máy tính và cộng đồng",
    lessonTitle: "Bài 1. Thông tin và dữ liệu",
    sourcePages: "Trang 6 – 8 (SGK Tin học 6 - Kết nối tri thức với cuộc sống)",
    sourceVerified: true,
    startupQuestion:
      "Trong cuộc sống hằng ngày, em nhìn thấy những con số, những dòng chữ, những hình ảnh trong sách; em nghe thấy tiếng chim hót, tiếng xe cộ đi lại trên đường. Tất cả những thứ đó được các giác quan của em thu nhận và xử lí như thế nào để trở thành những hiểu biết của em về thế giới xung quanh?",
    objectives: [
      "Nhận biết được sự khác nhau giữa thông tin và dữ liệu.",
      "Phân biệt được thông tin và vật mang tin.",
      "Nêu được ví dụ minh hoạ tầm quan trọng của thông tin.",
      "Nêu được ví dụ minh hoạ mối quan hệ giữa thông tin và dữ liệu.",
    ],
    knowledgeSections: [
      {
        heading: "1. Thông tin, dữ liệu và vật mang tin",
        paragraphs: [
          "Trong cuộc sống, những gì con người nhìn thấy, nghe thấy hay tiếp nhận dưới dạng con số, văn bản, hình ảnh, âm thanh, kí hiệu... được gọi là dữ liệu.",
          "Từ việc lắng nghe, quan sát và xử lí dữ liệu đó, con người rút ra được những hiểu biết mới. Những hiểu biết của con người về thế giới xung quanh và về chính bản thân mình gọi là thông tin. Vì vậy, thông tin có nguồn gốc từ dữ liệu.",
          "Phương tiện được dùng để lưu trữ và truyền tải thông tin (như giấy viết, tấm bảng, cây đèn giao thông, đĩa CD, thẻ nhớ...) được gọi là vật mang tin.",
        ],
        highlightBox: [
          "Thông tin là những hiểu biết của con người về thế giới xung quanh và về chính bản thân mình.",
          "Dữ liệu là những gì con người tiếp nhận để có được thông tin (con số, văn bản, hình ảnh, kí hiệu...).",
          "Vật mang tin là phương tiện dùng để lưu trữ và truyền tải thông tin.",
        ],
      },
      {
        heading: "2. Mối quan hệ giữa thông tin và dữ liệu",
        paragraphs: [
          "Thông tin là dữ liệu được xử lí để trở thành có ý nghĩa, và thông tin luôn phụ thuộc vào người tiếp nhận. Cùng một dữ liệu dự báo thời tiết, học sinh lớp 6 đọc sẽ hiểu 'hôm nay trời nắng', nhưng một em bé 5 tuổi chưa biết đọc thì dữ liệu đó chưa đem lại thông tin.",
          "Ngược lại, khi con người muốn truyền đạt thông tin cho người khác, thông tin đó được ghi lên các vật mang tin dưới dạng chữ viết, con số, hình ảnh... và lại trở thành dữ liệu.",
        ],
      },
      {
        heading: "3. Tầm quan trọng của thông tin",
        paragraphs: [
          "Thông tin đem lại hiểu biết cho con người. Mọi hoạt động của con người đều cần đến thông tin (ví dụ đọc bài lịch sử về Chiến dịch Điện Biên Phủ giúp em hiểu tinh thần chiến đấu của dân tộc).",
          "Thông tin đúng giúp con người đưa ra những lựa chọn tốt, có khả năng làm thay đổi hành động để hoạt động đạt hiệu quả và an toàn hơn.",
        ],
      },
    ],
    examples: [
      {
        title: "Ví dụ 1: Qua ngã tư có đèn giao thông (SGK tr. 6)",
        content:
          "Bạn Minh thấy đèn giao thông chuyển màu xanh và các xe bên chiều đèn đỏ đã dừng lại hẳn -> đó là Dữ liệu. Nhờ đó Minh biết có thể qua đường an toàn -> đó là Thông tin. Cây đèn giao thông là Vật mang tin.",
      },
      {
        title: "Ví dụ 2: Tấm bảng du lịch Đảo Cò (SGK tr. 7)",
        content:
          "Trung tâm du lịch viết lên bảng: 'Đảo Cò, xuồng máy, 40 000đ, 35 phút'. Những chữ và số viết trên bảng là Dữ liệu; tấm bảng gỗ là Vật mang tin; du khách đọc và hiểu giá vé 40.000 đồng, đi xuồng máy mất 35 phút là Thông tin.",
      },
      {
        title: "Ví dụ 3: Mẹ nhắc trời sắp mưa (SGK tr. 7)",
        content:
          "Trước khi sang nhà Minh học nhóm, An nghe mẹ nói 'Trời sắp mưa đấy nhé'. Thông tin này làm thay đổi hành động của An: bạn quay vào nhà cầm theo chiếc ô.",
      },
    ],
    keyTakeaways: [
      "Thông tin là hiểu biết của con người; dữ liệu là con số, văn bản, hình ảnh, âm thanh...; vật mang tin là vật chứa dữ liệu.",
      "Thông tin có nguồn gốc từ dữ liệu và phụ thuộc vào khả năng hiểu của người tiếp nhận.",
      "Thông tin đem lại hiểu biết và giúp con người đưa ra lựa chọn đúng đắn trong cuộc sống.",
    ],
    practiceItems: [
      {
        id: "l6-p1",
        question:
          "Câu hỏi 1 (tr. 7): Ghép đúng 1) Thông tin, 2) Dữ liệu, 3) Vật mang tin với a) Các số, văn bản, hình ảnh, âm thanh...; b) Hiểu biết của con người về thế giới; c) Vật chứa dữ liệu.",
        answer: "1 - b; 2 - a; 3 - c.",
        explanation:
          "Theo Hộp kiến thức SGK Tin học 6 tr. 6: Thông tin là hiểu biết của con người (b); Dữ liệu thể hiện dưới dạng số, văn bản, hình ảnh, âm thanh (a); Vật mang tin là vật chứa dữ liệu (c).",
      },
      {
        id: "l6-p2",
        question:
          "Câu hỏi 2 (tr. 7): Phân biệt '16:00', '0123456789' và câu 'Hãy gọi cho tôi lúc 16 giờ theo số điện thoại 0123456789.' đâu là dữ liệu, đâu là thông tin?",
        answer:
          "'16:00' và '0123456789' đứng riêng lẻ là dữ liệu. Câu hoàn chỉnh có ngữ cảnh đầy đủ là thông tin.",
        explanation:
          "Các con số đứng rời rạc chưa rõ mục đích chỉ là dữ liệu; khi đặt trong câu có ngữ cảnh rõ ràng giúp người đọc biết phải làm gì thì trở thành thông tin.",
      },
      {
        id: "l6-p3",
        question:
          "Luyện tập Bảng 1.1 Lượng mưa trung bình hàng tháng (tr. 8): Các con số ở cột tháng 9 là gì? Phát biểu 'Tháng 6, Đà Nẵng ít mưa nhất so với các thành phố khác' là gì?",
        answer:
          "a) Các con số ở cột tháng 9 là dữ liệu. b) Phát biểu so sánh rút ra từ bảng là thông tin.",
        explanation:
          "Số liệu thô trong bảng là dữ liệu. Khi em đọc, so sánh lượng mưa tháng 6 của Đà Nẵng (92,2 mm) nhỏ hơn Hà Nội, Huế, Vũng Tàu và rút ra kết luận thì đó là thông tin.",
      },
    ],
    applicationTasks: [
      {
        task: "Vận dụng 1 (tr. 8): Nêu ví dụ thông tin giúp em lựa chọn trang phục tốt hơn và đảm bảo an toàn giao thông.",
        hint: "Gợi ý: Xem dự báo nhiệt độ 15°C để mặc áo ấm; nhìn biển báo cấm đi ngược chiều để không đi vào đường cấm.",
      },
      {
        task: "Vận dụng 2 (tr. 8): Nêu ví dụ về vật mang tin giúp ích cho việc học tập của em.",
        hint: "Gợi ý: Sách giáo khoa, vở ghi chép, bảng lớp, thẻ nhớ USB, tệp PDF bài giảng.",
      },
      {
        task: "Vận dụng 3 (tr. 8): Lấy một ví dụ về dữ liệu trong cuộc sống và bổ sung tình huống để nó trở thành thông tin.",
        hint: "Gợi ý: Con số '39' đứng riêng là dữ liệu. Khi biết đó là kết quả đo nhiệt kế của em bé '39°C', thông tin cho biết em bé đang sốt cao cần đi khám.",
      },
    ],
    illustrationCaption:
      "Sơ đồ chuyển hoá giữa Dữ liệu, Xử lí, Thông tin và Vật mang tin (Bài 1 - Tin học 6)",
    illustrationNodes: [
      {
        step: "1",
        title: "Vật mang tin",
        detail: "Bảng hiệu, đèn giao thông, sách giáo khoa, ti vi",
      },
      {
        step: "2",
        title: "Dữ liệu",
        detail: "Con số, văn bản, hình ảnh, âm thanh, màu đèn",
      },
      {
        step: "3",
        title: "Xử lí (Giác quan / Não bộ)",
        detail: "Quan sát, lắng nghe, đọc hiểu theo ngữ cảnh",
      },
      {
        step: "4",
        title: "Thông tin",
        detail: "Hiểu biết có ý nghĩa giúp đưa ra quyết định đúng",
      },
    ],
    game: {
      title: "Thử thách Tin học 6 — Giải mã Thông tin & Dữ liệu",
      objective:
        "Phân biệt chính xác Thông tin, Dữ liệu, Vật mang tin và tầm quan trọng của thông tin theo Bài 1 (SGK Tin học 6 KNTT).",
      questions: [
        {
          id: 1,
          question:
            "Theo SGK Tin học 6, những hiểu biết của con người về thế giới xung quanh và về chính bản thân mình được gọi là gì?",
          options: ["Dữ liệu", "Thông tin", "Vật mang tin", "Thiết bị lưu trữ"],
          correctIndex: 1,
          explanation:
            "Thông tin là những hiểu biết của con người về thế giới xung quanh và về chính bản thân mình (SGK Tin học 6 KNTT, tr. 6).",
        },
        {
          id: 2,
          question:
            "Trong tình huống bạn Minh đi qua ngã tư, tín hiệu đèn giao thông màu xanh và các xe bên chiều đèn đỏ đã dừng lại là gì?",
          options: ["Thông tin", "Dữ liệu", "Vật mang tin", "Hành động"],
          correctIndex: 1,
          explanation:
            "Những gì bạn Minh nhìn thấy bằng mắt (màu xanh của đèn, xe dừng lại) là dữ liệu; điều Minh biết ('có thể qua đường an toàn') là thông tin.",
        },
        {
          id: 3,
          question:
            "Trong tình huống đèn giao thông ở ngã tư, bản thân cây đèn giao thông đóng vai trò là gì?",
          options: ["Thông tin", "Dữ liệu", "Vật mang tin", "Giác quan"],
          correctIndex: 2,
          explanation:
            "Vật mang tin là phương tiện được dùng để lưu trữ và truyền tải thông tin (cây đèn đường, giấy viết, tấm bảng, đĩa CD...).",
        },
        {
          id: 4,
          question:
            "Phương án nào dưới đây KHÔNG phải là ví dụ về vật mang tin?",
          options: [
            "Tấm bảng gỗ ghi giá vé Đảo Cò",
            "Trang sách giáo khoa Tin học 6",
            "Hiểu biết rằng hôm nay trời sẽ mưa",
            "Thẻ nhớ và đĩa CD",
          ],
          correctIndex: 2,
          explanation:
            "Hiểu biết rằng hôm nay trời sẽ mưa là thông tin, không phải vật thể vật lí chứa dữ liệu.",
        },
        {
          id: 5,
          question:
            "Vì sao bản tin dự báo thời tiết trên ti vi giúp học sinh lớp 6 biết 'hôm nay trời nắng', nhưng với em bé 5 tuổi chưa biết đọc thì không?",
          options: [
            "Vì ti vi bị hỏng âm thanh",
            "Vì thông tin luôn phụ thuộc vào con người (người tiếp nhận và xử lí dữ liệu)",
            "Vì dữ liệu trên ti vi không phải là chữ viết",
            "Vì em bé 5 tuổi không có thị giác",
          ],
          correctIndex: 1,
          explanation:
            "SGK tr. 7 nêu rõ: Thông tin là dữ liệu được xử lí để trở thành có ý nghĩa, và thông tin luôn phụ thuộc vào con người.",
        },
        {
          id: 6,
          question:
            "Trên tấm bảng ở bến tàu ghi: 'Đảo Cò, xuồng máy, 40 000đ, 35 phút'. Những chữ và số viết trên bảng là gì?",
          options: ["Thông tin", "Dữ liệu", "Vật mang tin", "Hành động"],
          correctIndex: 1,
          explanation:
            "Những số và chữ viết trên bảng là dữ liệu; tấm bảng là vật mang tin; nội dung du khách hiểu được là thông tin.",
        },
        {
          id: 7,
          question:
            "Dòng nào sau đây thể hiện rõ ràng một THÔNG TIN thay vì chỉ là dữ liệu rời rạc?",
          options: [
            "16:00",
            "0123456789",
            "43,8",
            "Hãy gọi cho tôi lúc 16 giờ theo số điện thoại 0123456789.",
          ],
          correctIndex: 3,
          explanation:
            "Câu hoàn chỉnh có ngữ cảnh truyền đạt được ý nghĩa cụ thể là thông tin; các số rời rạc 16:00 hay 0123456789 chỉ là dữ liệu.",
        },
        {
          id: 8,
          question:
            "Khi An nghe mẹ nói 'Trời sắp mưa đấy nhé', bạn An quay vào nhà cầm theo chiếc ô. Ví dụ này minh hoạ điều gì về tầm quan trọng của thông tin?",
          options: [
            "Thông tin có khả năng làm thay đổi hành động của con người",
            "Thông tin luôn ở dạng hình ảnh",
            "Chiếc ô là vật mang tin",
            "Dữ liệu không cần qua xử lí vẫn tạo ra hành động",
          ],
          correctIndex: 0,
          explanation:
            "SGK tr. 7: Thông tin đem lại hiểu biết và có khả năng làm thay đổi hành động của con người để đưa ra lựa chọn đúng.",
        },
        {
          id: 9,
          question:
            "Trong Bảng 1.1 (Lượng mưa trung bình hàng tháng), khi trả lời đúng câu hỏi 'Huế ít mưa nhất vào tháng nào trong năm?' thì câu trả lời tìm được là gì?",
          options: ["Vật mang tin", "Dữ liệu thô", "Thông tin", "Phương tiện truyền tin"],
          correctIndex: 2,
          explanation:
            "Sau khi đọc, so sánh các con số (dữ liệu) trong bảng của Huế và rút ra kết luận tháng ít mưa nhất (tháng 3: 34,1 mm), kết luận đó là thông tin.",
        },
        {
          id: 10,
          question:
            "Nhận định nào sau đây ĐÚNG về mối quan hệ giữa thông tin và dữ liệu?",
          options: [
            "Thông tin có trước rồi mới sinh ra giác quan",
            "Thông tin có nguồn gốc từ dữ liệu; khi ghi thông tin lên vật mang tin thì nó lại trở thành dữ liệu",
            "Dữ liệu và thông tin hoàn toàn giống nhau trong mọi tình huống",
            "Máy tính xử lí trực tiếp suy nghĩ của con người không cần dữ liệu",
          ],
          correctIndex: 1,
          explanation:
            "Thông tin có nguồn gốc từ dữ liệu (tr. 6) và khi thông tin được ghi lên vật mang tin để truyền đạt thì lại trở thành dữ liệu (tr. 7).",
        },
        ...EXTRA_GRADE6_QUESTIONS,
      ],
    },
    geminiGems: GRADE6_GEMINI_GEMS,
  },

  7: {
    grade: 7,
    label: "Khối 7 (Lớp 7A1)",
    subject: "Tin học",
    bookSeries: "Kết nối tri thức với cuộc sống",
    bookTitle: "SGK Tin học 7",
    chapterTitle: "Chủ đề 1. Máy tính và cộng đồng",
    lessonTitle: "Bài 1. Thiết bị vào – ra",
    sourcePages: "Trang 5 – 9 (SGK Tin học 7 - Kết nối tri thức với cuộc sống)",
    sourceVerified: true,
    startupQuestion:
      "Ở lớp 6, các em đã biết máy tính cần bốn thành phần: thiết bị vào, thiết bị ra, bộ xử lí và bộ nhớ. Vậy thiết bị vào và thiết bị ra đa dạng như thế nào và cần kết nối, sử dụng ra sao để đảm bảo an toàn cho máy tính?",
    objectives: [
      "Biết và nhận ra được các thiết bị vào – ra có nhiều loại, hình dạng khác nhau.",
      "Biết được chức năng của các thiết bị vào – ra trong thu nhận, lưu trữ, xử lí và truyền thông tin.",
      "Thực hiện đúng các thao tác với các thiết bị thông dụng của máy tính.",
      "Nêu được ví dụ cụ thể về những thao tác không đúng cách sẽ gây ra lỗi cho thiết bị và hệ thống xử lí thông tin.",
    ],
    knowledgeSections: [
      {
        heading: "1. Thiết bị vào – ra và sự đa dạng của thiết bị",
        paragraphs: [
          "Thiết bị vào được dùng để nhập thông tin vào máy tính (như bàn phím, chuột, micro, máy ảnh kĩ thuật số, bộ điều khiển game...).",
          "Thiết bị ra xuất thông tin từ máy tính ra bên ngoài để con người nhận biết được (như màn hình, máy in, loa, máy chiếu...).",
          "Một số thiết bị hiện đại vừa có chức năng vào vừa có chức năng ra (như màn hình cảm ứng touch screen) hoặc tích hợp cả lưu trữ, xử lí đơn giản (như loa thông minh, máy ghi hình kĩ thuật số).",
        ],
        highlightBox: [
          "Thiết bị vào được dùng để nhập thông tin vào máy tính.",
          "Thiết bị ra xuất thông tin từ máy tính ra để con người nhận biết được.",
          "Các thiết bị vào – ra có nhiều loại, có những công dụng và hình dạng khác nhau.",
        ],
      },
      {
        heading: "2. An toàn thiết bị khi kết nối và sử dụng",
        paragraphs: [
          "Máy tính sử dụng điện và kết nối nhiều thiết bị qua các cổng riêng biệt (cổng màn hình VGA/HDMI, cổng USB, cổng mạng LAN, cổng tai nghe, cổng micro, cổng nguồn...).",
          "Việc cấp nguồn điện cho máy tính phải thực hiện SAU khi đã kết nối đúng các thiết bị vào – ra để tránh chập điện hoặc hỏng đầu nối.",
        ],
        highlightBox: [
          "Đọc kĩ hướng dẫn của nhà sản xuất trước khi sử dụng thiết bị.",
          "Kết nối các thiết bị đúng cổng, đúng cách trước khi bật nguồn.",
          "Giữ gìn nơi làm việc với máy tính gọn gàng, ngăn nắp, vệ sinh, khô ráo.",
        ],
      },
    ],
    examples: [
      {
        title: "Ví dụ 1: Micro và Loa (SGK tr. 5)",
        content:
          "Micro thu nhận âm thanh của người nói và chuyển vào máy tính để mã hoá thành dữ liệu số (Thiết bị vào). Loa nhận dữ liệu từ máy tính và phát ra âm thanh cho người nghe (Thiết bị ra).",
      },
      {
        title: "Ví dụ 2: Màn hình cảm ứng & Touchpad (SGK tr. 6–7)",
        content:
          "Màn hình cảm ứng trên điện thoại/máy tính bảng vừa hiển thị hình ảnh (ra) vừa nhận thao tác chạm tay của em (vào). Tấm cảm ứng (touchpad) trên laptop thay thế chức năng của chuột máy tính.",
      },
      {
        title: "Ví dụ 3: Việc nên làm và không nên làm (Bảng 1.1 - SGK tr. 9)",
        content:
          "Nên: Giữ tay khô sạch, dùng lệnh Shut down để tắt máy, rút điện trước khi lau dọn. Không nên: Để đồ uống gần bàn phím/chuột, tắt máy bằng cách rút điện đột ngột, nối máy in khi một trong hai máy đang bật nguồn.",
      },
    ],
    keyTakeaways: [
      "Thiết bị vào đưa dữ liệu vào máy tính; thiết bị ra xuất thông tin ra bên ngoài.",
      "Nhiều thiết bị thông minh kiêm cả chức năng vào/ra (màn hình cảm ứng, tai nghe gắn micro).",
      "Luôn kết nối đúng cổng, thao tác nhẹ nhàng và dùng Shut down để bảo vệ dữ liệu và thiết bị.",
    ],
    practiceItems: [
      {
        id: "l7-p1",
        question:
          "Luyện tập 1 (tr. 9): Một bộ tai nghe có gắn micro sử dụng cho máy tính là loại thiết bị gì?",
        answer: "C. Thiết bị vừa vào vừa ra.",
        explanation:
          "Phần tai nghe phát âm thanh từ máy tính ra tai người (thiết bị ra), còn phần micro gắn kèm thu giọng nói đưa vào máy tính (thiết bị vào).",
      },
      {
        id: "l7-p2",
        question:
          "Luyện tập 2 (tr. 9): Sắp xếp thứ tự đúng các thao tác để tắt máy tính an toàn khi đang làm việc với một tệp trên thẻ nhớ: a) Shut down, b) Đóng tệp, c) Safe To Remove Hardware, d) Lưu lại nội dung tệp.",
        answer: "Thứ tự đúng: d) -> b) -> c) -> a).",
        explanation:
          "Trước hết phải lưu lại nội dung tệp (d), đóng tệp đang mở (b), ngắt kết nối thẻ nhớ an toàn (c) rồi mới chọn Shut down để tắt máy (a), tránh mất dữ liệu.",
      },
    ],
    applicationTasks: [
      {
        task: "Vận dụng 1 (tr. 9): Trên màn hình theo dõi, em thấy một người đứng trước camera an ninh. Người đó có biết em đang theo dõi không? Tại sao?",
        hint: "Gợi ý: Camera an ninh chỉ là thiết bị vào thu hình ảnh chuyển về màn hình ở phòng theo dõi, không phát hình ảnh người xem ngược lại.",
      },
      {
        task: "Vận dụng 2 (tr. 9): Máy in in ra kí hiệu không mong muốn do virus gây ra. Em cần diệt virus ở máy in hay máy tính? Tại sao?",
        hint: "Gợi ý: Diệt virus ở máy tính, vì máy tính xử lí dữ liệu và gửi lệnh in sang máy in; máy in chỉ là thiết bị ra thực hiện theo dữ liệu nhận được.",
      },
    ],
    illustrationCaption:
      "Mô hình kết nối Thiết bị vào -> Bộ xử lí & Bộ nhớ -> Thiết bị ra (SGK Tin học 7 - Hình 1.2)",
    illustrationNodes: [
      {
        step: "1",
        title: "Thiết bị vào (Input)",
        detail: "Bàn phím, chuột, micro, tay cầm game, máy quét",
      },
      {
        step: "2",
        title: "Bộ xử lí & Thiết bị lưu trữ",
        detail: "Tiếp nhận, mã hoá, tính toán và lưu dữ liệu số",
      },
      {
        step: "3",
        title: "Thiết bị ra (Output)",
        detail: "Màn hình, máy chiếu, loa, tai nghe, máy in",
      },
      {
        step: "4",
        title: "Thiết bị hai chiều & An toàn",
        detail: "Màn hình cảm ứng; tắt máy bằng Shut down",
      },
    ],
    game: {
      title: "Thử thách Tin học 7 — Chuyên gia Thiết bị Vào – Ra",
      objective:
        "Phân loại chính xác thiết bị vào, thiết bị ra, thiết bị hai chiều và quy tắc an toàn máy tính (Bài 1 - SGK Tin học 7 KNTT).",
      questions: [
        {
          id: 1,
          question:
            "Trong Hình 1.1 của SGK Tin học 7, Micro và Loa làm việc với dạng thông tin nào?",
          options: ["Hình ảnh", "Văn bản", "Âm thanh", "Con số"],
          correctIndex: 2,
          explanation:
            "Micro thu âm thanh đưa vào máy tính, còn loa xuất dữ liệu từ máy tính ra dạng âm thanh (SGK Tin học 7, tr. 5).",
        },
        {
          id: 2,
          question:
            "Máy ảnh nhập thông tin dạng nào vào máy tính?",
          options: ["Con số", "Văn bản", "Hình ảnh", "Âm thanh"],
          correctIndex: 2,
          explanation:
            "Câu hỏi kiểm tra trang 7 SGK: Máy ảnh là thiết bị vào thu nhận hình ảnh đưa vào máy tính.",
        },
        {
          id: 3,
          question:
            "Thiết bị nào sau đây là thiết bị RA xuất dữ liệu hình ảnh lên màn chiếu lớn?",
          options: ["Máy chiếu", "Chuột không dây", "Tấm cảm ứng Touchpad", "Micro"],
          correctIndex: 0,
          explanation:
            "SGK tr. 6: Máy chiếu là thiết bị ra, dùng để hiển thị nội dung màn hình máy tính lên màn chiếu.",
        },
        {
          id: 4,
          question:
            "Bộ điều khiển game (tay cầm chơi game) thuộc nhóm thiết bị nào?",
          options: ["Thiết bị ra", "Thiết bị vào", "Thiết bị lưu trữ", "Thiết bị nguồn"],
          correctIndex: 1,
          explanation:
            "Bộ điều khiển game đưa mệnh lệnh của người chơi vào máy tính để điều khiển đối tượng trong trò chơi nên là thiết bị vào.",
        },
        {
          id: 5,
          question:
            "Vì sao màn hình cảm ứng (touch screen) được xếp vào loại có cả hai chức năng vào và ra?",
          options: [
            "Vì nó cần cắm dây nguồn điện",
            "Vì vừa hiển thị hình ảnh ra cho người dùng xem, vừa nhận vị trí và sự di chuyển ngón tay chạm vào",
            "Vì nó có gắn sẵn loa bluetooth",
            "Vì màn hình cảm ứng có kích thước nhỏ hơn màn hình thường",
          ],
          correctIndex: 1,
          explanation:
            "SGK tr. 7: Màn hình cảm ứng hiển thị nội dung (ra) đồng thời phát hiện vị trí và sự di chuyển của ngón tay trên bề mặt (vào).",
        },
        {
          id: 6,
          question:
            "Một bộ tai nghe có gắn micro sử dụng cho máy tính là loại thiết bị gì?",
          options: [
            "Chỉ là thiết bị vào",
            "Chỉ là thiết bị ra",
            "Thiết bị vừa vào vừa ra",
            "Không phải thiết bị vào – ra",
          ],
          correctIndex: 2,
          explanation:
            "Phần tai nghe là thiết bị ra (phát âm thanh), phần micro là thiết bị vào (thu âm thanh).",
        },
        {
          id: 7,
          question:
            "Khi lắp ráp máy tính để bàn (Hình 1.5), việc cấp nguồn điện cho máy tính cần thực hiện khi nào?",
          options: [
            "Thực hiện trước khi cắm các thiết bị vào – ra",
            "Thực hiện SAU khi các thiết bị đã được kết nối đúng cổng",
            "Cắm nguồn cùng lúc với khi cắm cổng USB máy in",
            "Không cần quan tâm thứ tự cắm dây nguồn",
          ],
          correctIndex: 1,
          explanation:
            "SGK tr. 8: Việc cấp nguồn điện cho máy tính cần được thực hiện sau khi các thiết bị đã được kết nối để đảm bảo an toàn điện.",
        },
        {
          id: 8,
          question:
            "Thao tác nào sau đây tắt máy tính một cách an toàn?",
          options: [
            "Sử dụng nút lệnh Restart của Windows",
            "Sử dụng nút lệnh Shut down của Windows",
            "Nhấn giữ công tắc nguồn vài giây",
            "Rút dây nguồn khỏi ổ cắm",
          ],
          correctIndex: 1,
          explanation:
            "Câu hỏi trang 9 SGK: Chọn Shut down giúp hệ điều hành đóng ứng dụng và lưu trạng thái trước khi ngắt điện an toàn.",
        },
        {
          id: 9,
          question:
            "Theo Bảng 1.1 SGK Tin học 7, việc nào sau đây KHÔNG NÊN làm khi sử dụng máy tính?",
          options: [
            "Giữ bàn tay khô, sạch khi sử dụng máy tính",
            "Rút điện trước khi lau, dọn máy tính",
            "Để đồ uống gần chuột, bàn phím, thẻ nhớ",
            "Đóng mọi tài liệu và ứng dụng trước khi tắt máy",
          ],
          correctIndex: 2,
          explanation:
            "Để đồ uống gần thiết bị điện tử dễ gây đổ nước làm chập mạch, hỏng chuột, bàn phím hoặc thẻ nhớ.",
        },
        {
          id: 10,
          question:
            "Nếu máy in in ra kí hiệu lạ do virus máy tính gây ra, em cần diệt virus ở thiết bị nào?",
          options: [
            "Diệt virus ở máy in",
            "Diệt virus ở máy tính",
            "Thay dây nguồn của màn hình",
            "Diệt virus ở ổ cắm điện",
          ],
          correctIndex: 1,
          explanation:
            "Máy in chỉ là thiết bị ra thực hiện theo dữ liệu mà máy tính gửi sang; virus lây nhiễm trên hệ thống máy tính nên phải diệt virus ở máy tính.",
        },
        ...EXTRA_GRADE7_QUESTIONS,
      ],
    },
    geminiGems: [],
  },

  8: {
    grade: 8,
    label: "Khối 8 (Lớp 8A1)",
    subject: "Tin học",
    bookSeries: "Kết nối tri thức với cuộc sống",
    bookTitle: "SGK Tin học 8",
    chapterTitle: "Chủ đề 1. Máy tính và cộng đồng",
    lessonTitle: "Bài 1. Lược sử công cụ tính toán",
    sourcePages: "Trang 5 – 9 (SGK Tin học 8 - Kết nối tri thức với cuộc sống)",
    sourceVerified: true,
    startupQuestion:
      "Con người bắt đầu tính toán từ 10 ngón tay rồi đến bàn tính cách đây hơn 2000 năm. Những bước ngoặt nào đã biến cỗ máy tính cơ khí thô sơ thành chiếc máy tính điện tử thông minh và thay đổi toàn bộ xã hội loài người như ngày nay?",
    objectives: [
      "Trình bày được sơ lược lịch sử phát triển máy tính.",
      "Nêu được ví dụ cho thấy sự phát triển máy tính đã đem đến những thay đổi lớn lao cho xã hội loài người.",
    ],
    knowledgeSections: [
      {
        heading: "1. Từ bàn tính cổ đại đến máy tính cơ khí",
        paragraphs: [
          "Hơn 2000 năm trước Công nguyên, con người đã dùng bàn tính để thực hiện phép tính số học.",
          "Năm 1642, nhà bác học Pháp Blaise Pascal sáng chế máy tính cơ khí Pascaline dùng các bánh răng để giúp cha tính thuế. Sau đó Leibniz cải tiến thêm phép nhân, chia.",
          "Năm 1833, nhà toán học Anh Charles Babbage thiết kế máy tính đa năng, tính toán tự động theo nguyên lí giống máy tính ngày nay. Ông được coi là cha đẻ của công nghệ máy tính.",
        ],
        highlightBox: [
          "Năm 1642: Blaise Pascal sáng chế máy tính cơ khí Pascaline.",
          "Năm 1833: Charles Babbage thiết kế máy tính đa năng, tự động tương tự máy tính ngày nay.",
        ],
      },
      {
        heading: "2. Máy tính điện – cơ, Kiến trúc Von Neumann và 5 thế hệ máy tính điện tử",
        paragraphs: [
          "Năm 1943–1944, máy tính điện – cơ Harvard Mark I (ASCC) ra đời. Năm 1945, John Von Neumann đề xuất nguyên lí 'chương trình được lưu trữ' với bộ xử lí, bộ nhớ và thiết bị vào – ra.",
          "Máy tính điện tử từ những năm 1940 đến nay phát triển qua 5 thế hệ nhờ tiến bộ thu nhỏ linh kiện: Thế hệ 1 (1945–1955) dùng đèn điện tử chân không (ENIAC); Thế hệ 2 (1955–1965) dùng bóng bán dẫn (IBM 7090, MINSK 22); Thế hệ 3 (1965–1974) dùng mạch tích hợp IC (IBM System/360); Thế hệ 4 (1974–1990) dùng VLSI và bộ vi xử lí tạo ra máy vi tính; Thế hệ 5 (1990–nay) dùng mạch tích hợp cỡ siêu lớn ULSI và trí tuệ nhân tạo.",
        ],
        highlightBox: [
          "5 thế hệ gắn với 5 công nghệ linh kiện: Đèn điện tử chân không -> Bóng bán dẫn -> Mạch tích hợp (IC) -> Mạch tích hợp cỡ rất lớn (VLSI / Vi xử lí) -> Mạch tích hợp cỡ siêu lớn (ULSI) & Trí tuệ nhân tạo.",
        ],
      },
      {
        heading: "3. Máy tính thay đổi thế giới như thế nào?",
        paragraphs: [
          "Máy tính hoạt động bền bỉ, chính xác, tốc độ cao đã làm thay đổi sâu sắc mọi lĩnh vực: Y tế (đồng hồ thông minh theo dõi sức khoẻ), Giáo dục (học mọi nơi, mọi lúc qua Internet), Kinh tế (giao dịch số), Quốc phòng và An toàn xã hội (camera an ninh).",
        ],
      },
    ],
    examples: [
      {
        title: "Ví dụ 1: Nguồn gốc từ 'chữ số' (digit) (SGK tr. 5)",
        content:
          "Ban đầu con người đếm bằng 10 ngón tay. Trong tiếng Anh, từ 'digit' (chữ số) bắt nguồn từ 'digitus' trong tiếng Latin có nghĩa là ngón tay.",
      },
      {
        title: "Ví dụ 2: Máy tính thế hệ đầu tại Việt Nam (SGK tr. 7)",
        content:
          "Chiếc máy tính thế hệ thứ hai được đưa vào Việt Nam năm 1968 là MINSK 22. Chiếc máy tính thế hệ thứ ba được đưa vào nước ta năm 1967 thuộc họ IBM System/360.",
      },
    ],
    keyTakeaways: [
      "Lịch sử phát triển đi từ công cụ thô sơ (bàn tính) -> máy tính cơ khí (Pascal, Babbage) -> máy tính điện – cơ -> 5 thế hệ máy tính điện tử.",
      "Kiến trúc Von Neumann (1945) đặt nền móng lưu trữ chương trình và dữ liệu chung trong bộ nhớ.",
      "Sự phát triển của máy tính giúp xã hội chuyển dịch mạnh mẽ sang xã hội kĩ thuật số.",
    ],
    practiceItems: [
      {
        id: "l8-p1",
        question:
          "Câu hỏi tr. 6: Máy tính trong dự án của Babbage có những đặc điểm gì? (A. Cơ học, tự động; B. Ứng dụng ngoài tính toán thuần tuý; C. Thiết kế giống máy tính ngày nay; D. Cả ba đặc điểm trên)",
        answer: "D. Cả ba đặc điểm trên.",
        explanation:
          "SGK Tin học 8 tr. 6: Dự án của Babbage là máy tính cơ học, thực hiện tự động, đa năng ngoài tính toán thuần tuý và có thiết kế giống máy tính ngày nay.",
      },
      {
        id: "l8-p2",
        question:
          "Câu hỏi tr. 8: Bộ vi xử lí là linh kiện máy tính dựa trên công nghệ nào?",
        answer:
          "D. Mạch tích hợp cỡ lớn (VLSI), gồm hàng chục nghìn đến hàng triệu linh kiện bán dẫn.",
        explanation:
          "Ở thế hệ thứ tư (1974–1990), công nghệ VLSI tạo nên những bộ vi xử lí nguyên khối (như Intel 80386 XS).",
      },
      {
        id: "l8-p3",
        question:
          "Luyện tập 1 (tr. 9): Nêu ví dụ sự khác nhau rõ ràng trong hoạt động học tập khi chưa có và khi có thiết bị công nghệ số.",
        answer:
          "Trước đây phải tra cứu sách giấy tại thư viện theo giờ mở cửa; nay có thể học mọi nơi mọi lúc qua Internet, xem mô phỏng trực quan và nhận phản hồi từ hệ thống học tập.",
        explanation:
          "Theo mục 3 (Giáo dục, SGK tr. 9): Internet là kho thông tin khổng lồ giúp học sinh học mọi nơi, mọi lúc và giáo viên hỗ trợ từ xa hiệu quả.",
      },
    ],
    applicationTasks: [
      {
        task: "Vận dụng 1 (tr. 9): Vào thời điểm đất nước ta hoàn toàn thống nhất năm 1975, những thế hệ máy tính điện tử nào đã xuất hiện ở nước ta?",
        hint: "Gợi ý: Đối chiếu SGK tr. 7: Năm 1967 có máy tính thế hệ thứ ba (họ IBM System/360) và năm 1968 có máy tính thế hệ thứ hai (MINSK 22) tại Việt Nam.",
      },
      {
        task: "Vận dụng 2 (tr. 9): Đưa ra một dự báo về ứng dụng của máy tính trong tương lai và giải thích cơ sở.",
        hint: "Gợi ý: Máy tính thế hệ thứ năm tích hợp AI hỗ trợ cá nhân hoá y tế, giao thông tự hành hoặc trợ lí học tập thông minh.",
      },
    ],
    illustrationCaption:
      "Dòng thời gian phát triển Công cụ tính toán qua các thời kì (Bài 1 - Tin học 8)",
    illustrationNodes: [
      {
        step: "1",
        title: "Thô sơ & Cơ khí",
        detail: "Bàn tính (>2000 TCN) -> Pascaline (1642) -> Babbage (1833)",
      },
      {
        step: "2",
        title: "Điện – cơ & Von Neumann",
        detail: "Harvard Mark I (1943–1944) -> Chương trình lưu trữ (1945)",
      },
      {
        step: "3",
        title: "Thế hệ 1, 2, 3 (1945–1974)",
        detail: "Đèn chân không -> Bóng bán dẫn -> Mạch tích hợp (IC)",
      },
      {
        step: "4",
        title: "Thế hệ 4 & 5 (1974–nay)",
        detail: "VLSI (Vi xử lí) -> ULSI & Trí tuệ nhân tạo (AI)",
      },
    ],
    game: {
      title: "Thử thách Tin học 8 — Hành trình Lược sử Máy tính",
      objective:
        "Ghi nhớ các mốc lịch sử phát triển công cụ tính toán và 5 thế hệ máy tính điện tử (Bài 1 - SGK Tin học 8 KNTT).",
      questions: [
        {
          id: 1,
          question:
            "Trong tiếng Anh, từ 'digit' (chữ số) có nguồn gốc từ từ 'digitus' trong tiếng Latin mang ý nghĩa gì?",
          options: ["Hòn sỏi", "Ngón tay", "Bánh răng", "Bàn tính"],
          correctIndex: 1,
          explanation:
            "SGK Tin học 8 tr. 5: Các phép tính đầu tiên thực hiện bằng 10 ngón tay; 'digitus' trong tiếng Latin nghĩa là ngón tay.",
        },
        {
          id: 2,
          question:
            "Ai là người sáng chế ra chiếc máy tính cơ khí đầu tiên Pascaline vào năm 1642?",
          options: [
            "Charles Babbage",
            "Blaise Pascal",
            "John Von Neumann",
            "Claude Shannon",
          ],
          correctIndex: 1,
          explanation:
            "Năm 1642, nhà bác học Pháp Blaise Pascal sáng chế máy tính cơ khí Pascaline để giúp cha tính thuế (SGK tr. 5).",
        },
        {
          id: 3,
          question:
            "Ai được coi là 'cha đẻ của công nghệ máy tính' nhờ dự án máy tính đa năng, tính toán tự động năm 1833?",
          options: [
            "Gottfried Leibniz",
            "Howard Aiken",
            "Charles Babbage",
            "Alan Turing",
          ],
          correctIndex: 2,
          explanation:
            "SGK tr. 6: Tuy dự án năm 1833 không hoàn thành do hạn chế công nghệ thời đó, nguyên lí thiết kế của Charles Babbage giống máy tính ngày nay.",
        },
        {
          id: 4,
          question:
            "Khái niệm 'chương trình được lưu trữ' (lệnh chương trình lưu trong bộ nhớ cùng dữ liệu) do ai trình bày năm 1945?",
          options: [
            "John Von Neumann",
            "Blaise Pascal",
            "Gottfried Leibniz",
            "Howard Aiken",
          ],
          correctIndex: 0,
          explanation:
            "Năm 1945, John Von Neumann trình bày nguyên lí máy tính với khái niệm chương trình được lưu trữ (SGK tr. 6).",
        },
        {
          id: 5,
          question:
            "Máy tính điện tử thế hệ thứ NHẤT (1945–1955) như ENIAC sử dụng thành phần điện tử chính là gì?",
          options: [
            "Bóng bán dẫn",
            "Mạch tích hợp (IC)",
            "Đèn điện tử chân không",
            "Bộ vi xử lí VLSI",
          ],
          correctIndex: 2,
          explanation:
            "SGK tr. 7: Thế hệ thứ nhất sử dụng đèn điện tử chân không, kích thước rất lớn (chiếm cả căn phòng).",
        },
        {
          id: 6,
          question:
            "Cải tiến công nghệ nào đánh dấu sự ra đời của máy tính thế hệ thứ HAI (1955–1965)?",
          options: [
            "Đèn điện tử chân không",
            "Bóng bán dẫn",
            "Mạch tích hợp cỡ siêu lớn ULSI",
            "Bàn tính cơ học",
          ],
          correctIndex: 1,
          explanation:
            "SGK tr. 7: Bóng bán dẫn là cải tiến lớn tạo nên thế hệ thứ hai nhỏ hơn, rẻ hơn và nhanh hơn hàng chục lần thế hệ đầu.",
        },
        {
          id: 7,
          question:
            "Máy tính thế hệ thứ BA (1965–1974) được chế tạo dựa trên công nghệ nào?",
          options: [
            "Rơ le điện cơ",
            "Mạch tích hợp (IC - Integrated Circuit)",
            "Đèn điện tử chân không",
            "Bánh răng cơ khí",
          ],
          correctIndex: 1,
          explanation:
            "SGK tr. 7: Thế hệ thứ ba dựa trên mạch tích hợp IC, tiêu biểu như dòng IBM System/360.",
        },
        {
          id: 8,
          question:
            "Bộ vi xử lí (tạo ra máy vi tính như IBM PC, Apple II) là thành tựu của thế hệ máy tính nào?",
          options: [
            "Thế hệ thứ hai",
            "Thế hệ thứ ba",
            "Thế hệ thứ tư (1974–1990)",
            "Máy tính điện – cơ",
          ],
          correctIndex: 2,
          explanation:
            "SGK tr. 8: Công nghệ mạch tích hợp cỡ rất lớn (VLSI) ở thế hệ thứ tư tạo ra các bộ vi xử lí và máy vi tính.",
        },
        {
          id: 9,
          question:
            "Đặc trưng nổi bật của máy tính thế hệ thứ NĂM (1990 – ngày nay) là gì?",
          options: [
            "Chỉ thực hiện cộng trừ bằng tay",
            "Mạch tích hợp cỡ siêu lớn (ULSI) và một số khả năng trí tuệ nhân tạo (AI)",
            "Kích thước lớn bằng cả căn phòng",
            "Chỉ dùng thẻ đục lỗ làm thiết bị vào – ra",
          ],
          correctIndex: 1,
          explanation:
            "SGK tr. 8: Thế hệ thứ năm dùng công nghệ ULSI, xử lí song song và có khả năng cảm nhận, suy luận, tương tác gọi là trí tuệ nhân tạo.",
        },
        {
          id: 10,
          question:
            "Chiếc máy tính thế hệ thứ hai nào đã được đưa vào Việt Nam vào năm 1968?",
          options: ["ENIAC", "Pascaline", "MINSK 22", "Harvard Mark I"],
          correctIndex: 2,
          explanation:
            "SGK tr. 7: Chiếc máy tính thế hệ thứ hai đưa vào Việt Nam năm 1968 là MINSK 22 (sản xuất tại Belarus).",
        },
        ...EXTRA_GRADE8_QUESTIONS,
      ],
    },
    geminiGems: [],
  },
};

export const STUDENT_GUIDE_PROMPTS = {
  askTutor: {
    title: "A. Prompt hỏi bài (Nhờ gia sư AI giải thích)",
    description:
      "Dùng khi em muốn hiểu sâu bài học, hỏi khái niệm khó hoặc nhờ chữa bài mà vẫn tự rèn luyện tư duy.",
    buildPrompt: (grade: number, lessonTitle: string, sourceRef: string) =>
      `Bạn là Gia sư Socratic thân thiện, hỗ trợ học sinh Lớp ${grade}.
Mình đang học bài: "${lessonTitle}" (Nguồn chính: ${sourceRef}).

Khi hướng dẫn mình, hãy tuân thủ đúng các quy tắc sau:
1. Giải thích đúng trình độ học sinh Lớp ${grade} và bám sát nội dung bài học trên.
2. Ưu tiên dùng kiến thức từ sách giáo khoa / tài liệu mình cung cấp dưới đây.
3. Gợi ý từng bước ngắn gọn để mình tự suy nghĩ, KHÔNG đưa ngay đáp án cuối cùng khi mình đang làm bài.
4. Sau mỗi phần giải thích, hãy hỏi lại 1 câu ngắn để kiểm tra xem mình đã hiểu chưa.
5. Nếu mình gửi thiếu đề bài hoặc thiếu nội dung nguồn SGK, hãy yêu cầu mình bổ sung thêm chứ tuyệt đối không tự đoán.
6. Khi chữa bài mình đã làm, hãy chỉ ra chỗ đúng, chỗ cần sửa, giải thích vì sao và cho mình thử làm lại một lần nữa.

[Đề bài / Câu hỏi của mình]: (Em dán câu hỏi hoặc bài làm của em vào đây)
[Đoạn SGK / Tài liệu tham khảo]: (Em dán thêm nội dung trong bài học nếu cần)`,
  },
  createGame: {
    title: "B. Prompt tạo trò chơi HTML ôn tập",
    description:
      "Dùng để yêu cầu AI tạo ra một trò chơi ôn tập chạy ngay trên trình duyệt từ nội dung bài học.",
    buildPrompt: (grade: number, lessonTitle: string, sourceRef: string) =>
      `Hãy đóng vai giáo viên Tin học thiết kế trò chơi ôn tập tương tác bằng 1 tệp HTML duy nhất (chạy trực tiếp trên trình duyệt) cho học sinh Lớp ${grade}.

Thông tin bài học:
- Khối lớp: Lớp ${grade}
- Bài học: ${lessonTitle}
- Nguồn kiến thức: ${sourceRef}

Yêu cầu bắt buộc:
1. Chỉ sử dụng kiến thức trong nội dung bài học mình cung cấp bên dưới (hoặc kiến thức đã học đúng trình độ Lớp ${grade}), không đưa kiến thức ngoài chương trình.
2. Thiết kế trò chơi có luật chơi rõ ràng, hiển thị tên bài học, mục tiêu ôn tập, bộ đếm điểm và phản hồi Đúng/Sai ngay sau mỗi câu.
3. Tạo tối thiểu 10 câu hỏi trắc nghiệm hoặc nhiệm vụ ngắn bám sát bài học.
4. Mỗi câu hỏi đều phải kèm đáp án đúng và giải thích ngắn gọn vì sao đúng.
5. Giao diện tươi sáng, chữ to dễ đọc, phù hợp lứa tuổi học sinh THCS, bấm tốt trên cả máy tính lẫn điện thoại.
6. An toàn tuyệt đối: không thu thập thông tin cá nhân, không nhúng thư viện ngoài và không gửi dữ liệu ra máy chủ bên ngoài.

[Nội dung kiến thức bài học]: (Em dán phần chốt kiến thức hoặc tóm tắt bài học vào đây)`,
  },
};

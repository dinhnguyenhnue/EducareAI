"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Network,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Database,
  Lock,
  HardDrive,
  RefreshCw,
  CheckSquare,
  Building2,
  UserCheck,
} from "lucide-react";

export default function TeacherGoogleWorkspacePage() {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "DRIVE" | "SHEETS" | "BACKUP" | "DOCS" | "CLASSROOM" | "CALENDAR" | "LOGS"
  >("OVERVIEW");

  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [accountMode, setAccountMode] = useState<"PERSONAL_GMAIL_HYBRID" | "WORKSPACE_DOMAIN">(
    "PERSONAL_GMAIL_HYBRID"
  );

  // Class Tracking Sheet state
  const [selectedClass, setSelectedClass] = useState("7A1");
  const [activeSheetTab, setActiveSheetTab] = useState<
    | "tab1_TongQuan"
    | "tab2_DanhSachHS"
    | "tab3_TienDoHocTap"
    | "tab4_DiemVaRubric"
    | "tab5_SanPhamSangTao"
    | "tab6_BaoCaoAI"
  >("tab3_TienDoHocTap");
  const [stagedNotesDiff, setStagedNotesDiff] = useState<any[] | null>(null);
  const [simulateScoreTamper, setSimulateScoreTamper] = useState(true);

  const [createdDoc, setCreatedDoc] = useState<any>(null);
  const [restoreDrillResult, setRestoreDrillResult] = useState<any>(null);

  // Docs template form state
  const [docTitle, setDocTitle] = useState("Đề kiểm tra 15 phút - Chủ đề An toàn số");
  const [docType, setDocType] = useState<"EXAM" | "LESSON_PLAN" | "WORKSHEET" | "RUBRIC_GUIDE">("EXAM");
  const [docSubject, setDocSubject] = useState("Tin học 7");
  const [docTopic, setDocTopic] = useState("Chủ đề A: Máy tính và cộng đồng");

  // Calendar event form state
  const [calTitle, setCalTitle] = useState("Hạn nộp Dự án Infographic Văn hóa số");
  const [calClass, setCalClass] = useState("7A1");
  const [remind1Day, setRemind1Day] = useState(true);
  const [remind1Hour, setRemind1Hour] = useState(true);

  const fetchWorkspaceState = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/google/workspace");
      const data = await res.json();
      setWorkspaceData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceState();
  }, []);

  const runWorkspaceAction = async (action: string, payload: any = {}) => {
    setActionLoading(action);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/google/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const result = await res.json();
      if (res.ok) {
        setFeedbackMsg(result.message);
        if (action === "STAGE_SHEET_TEACHER_NOTES" && result.data?.diffs) {
          setStagedNotesDiff(result.data.diffs);
        }
        if (action === "CONFIRM_SHEET_TEACHER_NOTES") {
          setStagedNotesDiff(null);
        }
        if (action === "CREATE_DOC_TEMPLATE" && result.data) {
          setCreatedDoc(result.data);
        }
        if (action === "VERIFY_RESTORE_DRILL" && result.data) {
          setRestoreDrillResult(result.data);
        }
        await fetchWorkspaceState();
      } else {
        setFeedbackMsg(`Lỗi: ${result.error}`);
      }
    } catch (err: any) {
      setFeedbackMsg("Có lỗi kết nối khi thực thi tác vụ Google API.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeOAuth = async () => {
    setActionLoading("REVOKE");
    try {
      const res = await fetch("/api/auth/google?email=thay.tuan@unigo.edu.vn", {
        method: "DELETE",
      });
      const data = await res.json();
      setFeedbackMsg(data.message);
      await fetchWorkspaceState();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReconnectOAuth = async () => {
    setActionLoading("RECONNECT");
    try {
      await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "thay.tuan@unigo.edu.vn",
          googleEmail: "trantuan.unigo@gmail.com",
        }),
      });
      setFeedbackMsg("Đã kết nối lại OAuth 2.0 và cấp quyền thành công.");
      await fetchWorkspaceState();
    } finally {
      setActionLoading(null);
    }
  };

  const connection = workspaceData?.connection;
  const isConnected = connection?.status === "CONNECTED";
  const driveNodes = workspaceData?.driveFolderNodes || [];
  const trackingSheets = workspaceData?.classTrackingSheets || [];
  const currentTrackingSheet =
    trackingSheets.find((s: any) => s.className === selectedClass) || trackingSheets[0];
  const parsedTabs = currentTrackingSheet?.tabsJson
    ? JSON.parse(currentTrackingSheet.tabsJson)
    : null;
  const activeTabPayload = parsedTabs ? parsedTabs[activeSheetTab] : null;
  const backupRecords = workspaceData?.backupRecords || [];
  const syncCadencePolicy = workspaceData?.syncCadencePolicy || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Architecture Header */}
        <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-teal">
              <Network className="w-4 h-4" />
              <span>
                KIẾN TRÚC 3 TẦNG DỮ LIỆU THỐNG NHẤT • SUPABASE + GOOGLE SHEETS + GOOGLE DRIVE + CLASSROOM
              </span>
            </div>
            <h1 className="text-2xl font-bold text-ink mt-1">
              Trung tâm Đồng bộ & Lưu trữ Liên thông EDUCARE AI
            </h1>
            <p className="text-xs text-ink-muted mt-1 max-w-3xl">
              <strong>Tầng 1 (Supabase / Primary DB)</strong> giữ vai trò nguồn dữ liệu chuẩn duy nhất cho tài khoản, điểm chính thức, bài nộp, ngân hàng câu hỏi và chi phí AI.{" "}
              <strong>Tầng 2 (Google Sheets)</strong> tự động tạo bảng tracking 6 tabs theo từng lớp.{" "}
              <strong>Tầng 3 (Google Drive)</strong> quản lý kho học liệu 6 nhánh thư mục và bản sao lưu CSDL mã hóa AES-256-GCM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isConnected ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã kết nối: {connection?.googleEmail}
                </span>
                <button
                  onClick={handleRevokeOAuth}
                  disabled={actionLoading === "REVOKE"}
                  className="px-3 py-1.5 rounded-button border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Ngắt kết nối
                </button>
              </>
            ) : (
              <button
                onClick={handleReconnectOAuth}
                disabled={actionLoading === "RECONNECT"}
                className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Kết nối Google OAuth 2.0
              </button>
            )}
          </div>
        </div>

        {/* Account Mode Configuration Banner (Workspace vs Personal Gmail Hybrid) */}
        <div className="p-4 rounded-panel bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
              <ShieldCheck className="w-4 h-4" />
              <span>CHẾ ĐỘ TÀI KHOẢN TRIỂN KHAI TẠI TRƯỜNG UNIGO (HỖ TRỢ ĐỒNG THỜI CẢ 2 MÔ HÌNH)</span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl">
              {accountMode === "PERSONAL_GMAIL_HYBRID" ? (
                <>
                  Đang chọn <strong>Chế độ Hỗn hợp (Gmail Cá nhân + Mã Học sinh nội bộ)</strong>: Phù hợp ngay với Super Admin{" "}
                  <code className="text-amber-300">dinhnguyenhnue@gmail.com</code> và giáo viên dùng Gmail cá nhân. Hệ thống tự tạo cây thư mục Drive & bảng Sheets trong Drive của tài khoản quản trị/giáo viên, phân quyền tường minh theo email (không bật link công khai) và cho phép học sinh chưa có Gmail đăng nhập bằng Mã HS.
                </>
              ) : (
                <>
                  Đang chọn <strong>Chế độ Google Workspace for Education (@unigo.edu.vn)</strong>: Đồng bộ danh sách lớp trực tiếp từ Google Classroom của trường, lưu trữ trên Shared Drive của tổ bộ môn và tự động ánh xạ OU học sinh theo khối lớp 6–9.
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAccountMode("PERSONAL_GMAIL_HYBRID")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                accountMode === "PERSONAL_GMAIL_HYBRID"
                  ? "bg-teal-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Gmail Cá nhân + Mã HS (Khuyên dùng)
            </button>
            <button
              onClick={() => setAccountMode("WORKSPACE_DOMAIN")}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                accountMode === "WORKSPACE_DOMAIN"
                  ? "bg-teal-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Google Workspace Trường
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="p-4 rounded-card bg-brand-teal-soft border border-brand-teal/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-teal">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs text-ink-muted hover:text-ink font-semibold"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
          {[
            { id: "OVERVIEW", label: "1. Phân chia 3 tầng & Chu kỳ", icon: Database },
            { id: "SHEETS", label: "2. Sheets Tracking 6 Tabs", icon: FileSpreadsheet },
            { id: "DRIVE", label: "3. Drive 6 Nhánh Thư mục", icon: FolderOpen },
            { id: "BACKUP", label: "4. Backup Mã hóa & Khôi phục", icon: HardDrive },
            { id: "CLASSROOM", label: "5. Google Classroom", icon: Layers },
            { id: "DOCS", label: "6. Google Docs Mẫu", icon: FileText },
            { id: "CALENDAR", label: "7. Google Calendar", icon: Calendar },
            { id: "LOGS", label: "8. Nhật ký Đồng bộ", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-t-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-brand-teal text-brand-teal bg-brand-teal-soft/40"
                    : "border-transparent text-ink-muted hover:text-ink hover:bg-canvas"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW (Data Division Table & Sync Cadence Schedule) */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* 3-Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-panel bg-surface border border-border shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    Tầng 1 · Nguồn dữ liệu chuẩn
                  </span>
                  <Database className="w-4 h-4 text-brand-teal" />
                </div>
                <h3 className="text-base font-bold text-ink">Supabase (PostgreSQL + RLS)</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Lưu trữ chính thức tài khoản, lớp, phân quyền RBAC, điểm số, lịch sử làm bài, ngân hàng câu hỏi đa môn, nhận xét được duyệt, chi phí AI và danh mục{" "}
                  <code>folderId</code> / <code>fileId</code>.
                </p>
              </div>

              <div className="p-5 rounded-panel bg-surface border border-border shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Tầng 2 · Lớp Tracking & Báo cáo
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-ink">Google Sheets (6 Tabs / Lớp)</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Tự động tạo bảng <code>EDUCARE_AI_Tracking_7A1</code> để giáo viên theo dõi KPI và nhập ghi chú. Không tự động ghi đè điểm chính thức trong Supabase nếu chưa qua bước xác nhận.
                </p>
              </div>

              <div className="p-5 rounded-panel bg-surface border border-border shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Tầng 3 · Kho Học liệu & Sao lưu
                  </span>
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-ink">Google Drive (6 Nhánh Chuẩn)</h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Tổ chức tự động từ <code>01_QUAN_TRI</code> đến <code>06_BACKUP</code>. Lưu bản gốc học liệu, phiên bản trò chơi HTML và bản sao lưu CSDL mã hóa AES-256-GCM độc lập.
                </p>
              </div>
            </div>

            {/* Data Division Matrix */}
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-ink">
                    Ma trận Phân chia Dữ liệu Chống Chồng chéo (Single Source of Truth)
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Mỗi loại dữ liệu chỉ có đúng 1 hệ thống chính chịu trách nhiệm toàn vẹn; các nền tảng khác nhận bản đồng bộ tự động.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      runWorkspaceAction("PROVISION_DRIVE_6_FOLDERS", { accountMode })
                    }
                    disabled={actionLoading !== null}
                    className="px-3.5 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors"
                  >
                    Khởi tạo Cây Drive 6 Nhánh
                  </button>
                  <button
                    onClick={() =>
                      runWorkspaceAction("SYNC_CLASS_TRACKING_SHEET", { className: "7A1" })
                    }
                    disabled={actionLoading !== null}
                    className="px-3.5 py-2 rounded-button bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Đồng bộ Tracking 7A1 (6 Tabs)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-canvas text-ink-muted">
                      <th className="py-2.5 px-3 font-semibold">Loại dữ liệu</th>
                      <th className="py-2.5 px-3 font-semibold">Hệ thống chính (Authoritative)</th>
                      <th className="py-2.5 px-3 font-semibold">Đồng bộ hoặc lưu bản sao</th>
                      <th className="py-2.5 px-3 font-semibold">Quy tắc bảo vệ toàn vẹn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      {
                        type: "Tài khoản, lớp, phân quyền RBAC",
                        primary: "Supabase (User, SchoolClass, Role)",
                        mirror: "Sheets: Tab 'Danh sách HS' & 'Tổng quan'",
                        rule: "Xác thực Google sub + Session HttpOnly ở Server",
                      },
                      {
                        type: "Điểm số, bài làm, lịch sử học tập",
                        primary: "Supabase (Grade, Submission, Attempt)",
                        mirror: "Sheets: Tab 'Tiến độ học tập' & 'Điểm & Rubric'",
                        rule: "Cấm Sheets tự động ghi đè điểm chính thức trong Supabase",
                      },
                      {
                        type: "Bài giảng, PDF, Word, Slide",
                        primary: "Google Drive (02_HOC_LIEU/<Môn>)",
                        mirror: "Supabase: Lưu fileId, folderId, metadata",
                        rule: "Tìm tệp bằng fileId cố định, không phụ thuộc tên thư mục",
                      },
                      {
                        type: "Trò chơi HTML tương tác đa môn",
                        primary: "Kho lưu trữ kiểm soát (ProjectVersion)",
                        mirror: "Drive: 04_SAN_PHAM_SANG_TAO/Tro_choi_HTML",
                        rule: "Cô lập bằng iframe sandbox='allow-scripts' + CSP khóa mạng",
                      },
                      {
                        type: "Bài tập trên Google Classroom",
                        primary: "Classroom hoặc EDUCARE AI theo cấu hình",
                        mirror: "Supabase: classroomCourseworkId đồng bộ 2 chiều",
                        rule: "Kiểm tra Idempotency chống nhân đôi bài tập khi thử lại",
                      },
                      {
                        type: "Rubric, nhận xét của giáo viên",
                        primary: "Supabase (Submission, LearningProgress)",
                        mirror: "Sheets: Báo cáo đã lọc + Cột Ghi chú GV",
                        rule: "Ghi chú sửa trên Sheets phải qua bước Xác nhận mới lưu vào DB",
                      },
                      {
                        type: "Lịch sử và chi phí sử dụng AI",
                        primary: "Supabase (AIUsageLog)",
                        mirror: "Sheets: Tab 'Báo cáo AI' (Thống kê token & USD)",
                        rule: "Ẩn nội dung tâm sự riêng tư của HS với AI Tutor (SRS §4.5)",
                      },
                      {
                        type: "Bản sao phục hồi hệ thống",
                        primary: "Backup PostgreSQL/DB độc lập (SystemBackupRecord)",
                        mirror: "Drive: 06_BACKUP/Database_Encrypted (AES-256-GCM)",
                        rule: "Sheets không thay thế backup DB; kiểm tra SHA-256 hàng tuần",
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-canvas/60">
                        <td className="py-2.5 px-3 font-semibold text-ink">{row.type}</td>
                        <td className="py-2.5 px-3 text-brand-teal font-medium">{row.primary}</td>
                        <td className="py-2.5 px-3 text-ink-muted">{row.mirror}</td>
                        <td className="py-2.5 px-3 text-slate-700">{row.rule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operational Sync & Backup Cadence Schedule */}
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <h2 className="text-base font-bold text-ink">
                Lịch vận hành Đồng bộ & Sao lưu 6 Chu kỳ Chuẩn
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-canvas text-ink-muted">
                      <th className="py-2.5 px-3 font-semibold">Chu kỳ vận hành</th>
                      <th className="py-2.5 px-3 font-semibold">Tầng dữ liệu</th>
                      <th className="py-2.5 px-3 font-semibold">Hoạt động nghiệp vụ</th>
                      <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {syncCadencePolicy.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-canvas/60">
                        <td className="py-2.5 px-3 font-bold text-ink">{item.cadence}</td>
                        <td className="py-2.5 px-3 font-medium text-brand-teal">{item.layer}</td>
                        <td className="py-2.5 px-3 text-ink-muted">{item.activity}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE SHEETS CLASS TRACKING (EDUCARE_AI_Tracking_7A1 - 6 TABS + CONFIRM IMPORT) */}
        {activeTab === "SHEETS" && (
          <div className="space-y-6">
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      Spreadsheet Tự động theo Lớp
                    </span>
                    <code className="text-xs font-mono text-brand-teal font-bold">
                      {currentTrackingSheet?.spreadsheetTitle || `EDUCARE_AI_Tracking_${selectedClass}`}
                    </code>
                  </div>
                  <h2 className="text-lg font-bold text-ink mt-1">
                    Bảng Theo dõi & Báo cáo Tự động 6 Tabs ({selectedClass})
                  </h2>
                  <p className="text-xs text-ink-muted">
                    Spreadsheet ID trong Supabase:{" "}
                    <code className="font-mono text-ink">
                      {currentTrackingSheet?.spreadsheetId || "Chưa khởi tạo"}
                    </code>{" "}
                    • Thư mục lưu trữ:{" "}
                    <code>EDUCARE_AI/05_TRACKING_REPORTS/Tracking_theo_lop/</code>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 rounded-button border border-border bg-canvas text-xs font-semibold text-ink"
                  >
                    <option value="7A1">Lớp 7A1 (THCS UNIGO)</option>
                    <option value="6A1">Lớp 6A1 (THCS UNIGO)</option>
                    <option value="8A1">Lớp 8A1 (THCS UNIGO)</option>
                  </select>
                  <button
                    onClick={() =>
                      runWorkspaceAction("SYNC_CLASS_TRACKING_SHEET", {
                        className: selectedClass,
                      })
                    }
                    disabled={actionLoading !== null}
                    className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tạo / Đồng bộ Bảng Tracking {selectedClass} (6 Tabs)
                  </button>
                </div>
              </div>

              {/* 6 Sheet Tabs Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-b border-border">
                {[
                  { key: "tab1_TongQuan", label: "1. Tổng quan" },
                  { key: "tab2_DanhSachHS", label: "2. Danh sách HS" },
                  { key: "tab3_TienDoHocTap", label: "3. Tiến độ học tập" },
                  { key: "tab4_DiemVaRubric", label: "4. Điểm & Rubric" },
                  { key: "tab5_SanPhamSangTao", label: "5. Sản phẩm sáng tạo" },
                  { key: "tab6_BaoCaoAI", label: "6. Báo cáo AI" },
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setActiveSheetTab(st.key as any)}
                    className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeSheetTab === st.key
                        ? "border-emerald-600 text-emerald-800 bg-emerald-50"
                        : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Active Sheet Tab Table */}
              {activeTabPayload ? (
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-950 text-white">
                        {activeTabPayload.headers.map((h: string, i: number) => (
                          <th key={i} className="py-2.5 px-3 font-semibold border-r border-emerald-800 last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeTabPayload.rows.map((row: string[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-canvas/70">
                          {row.map((cell: string, cIdx: number) => (
                            <td key={cIdx} className="py-2.5 px-3 text-ink border-r border-border last:border-r-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-canvas rounded-lg border border-dashed border-border space-y-3">
                  <p className="text-xs text-ink-muted">
                    Bảng <code>EDUCARE_AI_Tracking_{selectedClass}</code> chưa có bản chụp dữ liệu. Bấm nút bên dưới để đồng bộ 6 tabs từ Supabase sang Google Sheets.
                  </p>
                  <button
                    onClick={() =>
                      runWorkspaceAction("SYNC_CLASS_TRACKING_SHEET", {
                        className: selectedClass,
                      })
                    }
                    className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold"
                  >
                    Khởi tạo EDUCARE_AI_Tracking_{selectedClass} ngay
                  </button>
                </div>
              )}
            </div>

            {/* Teacher Notes Confirm-Before-Import Protection Box */}
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>
                      QUY TRÌNH NHẬP & XÁC NHẬN GHI CHÚ TỪ SHEETS (CHỐNG GHI ĐÈ ĐIỂM CHÍNH THỨC TRONG SUPABASE)
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 max-w-3xl">
                    Giáo viên có thể chỉnh sửa phần <strong>Ghi chú và Nhận xét</strong> trong các cột riêng trên Google Sheets. Dữ liệu điểm chính thức luôn được bảo vệ trong Supabase; khi đọc từ Sheets về, hệ thống lập bảng đối chiếu và chờ giáo viên xác nhận tường minh.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer mr-2">
                    <input
                      type="checkbox"
                      checked={simulateScoreTamper}
                      onChange={(e) => setSimulateScoreTamper(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Giả lập ai đó sửa cột Điểm trên Sheets</span>
                  </label>
                  <button
                    onClick={() =>
                      runWorkspaceAction("STAGE_SHEET_TEACHER_NOTES", {
                        className: selectedClass,
                        simulateScoreTamper,
                      })
                    }
                    disabled={actionLoading !== null}
                    className="px-3.5 py-2 rounded-button border border-border bg-canvas hover:bg-slate-100 text-ink text-xs font-semibold"
                  >
                    Bước 1: Đọc & Kiểm tra Ghi chú từ Sheets
                  </button>
                  {stagedNotesDiff && (
                    <button
                      onClick={() =>
                        runWorkspaceAction("CONFIRM_SHEET_TEACHER_NOTES", {
                          className: selectedClass,
                          simulateScoreTamper,
                        })
                      }
                      disabled={actionLoading !== null}
                      className="px-4 py-2 rounded-button bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Bước 2: Xác nhận lưu Ghi chú vào Supabase
                    </button>
                  )}
                </div>
              </div>

              {stagedNotesDiff && (
                <div className="overflow-x-auto border border-amber-200 rounded-lg bg-amber-50/40 p-3 space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    Bản xem trước đối chiếu dữ liệu từ Google Sheets (Chờ giáo viên xác nhận):
                  </p>
                  <table className="w-full text-left border-collapse text-xs bg-white rounded">
                    <thead>
                      <tr className="border-b border-border bg-canvas">
                        <th className="py-2 px-3">Mã HS</th>
                        <th className="py-2 px-3">Học sinh</th>
                        <th className="py-2 px-3">Ghi chú mới từ Google Sheets</th>
                        <th className="py-2 px-3">Kiểm tra Bảo vệ Điểm số Supabase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stagedNotesDiff.map((d: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-mono font-semibold">{d.studentCode}</td>
                          <td className="py-2 px-3 font-semibold">{d.studentName}</td>
                          <td className="py-2 px-3 text-ink">{d.newTeacherNote}</td>
                          <td className="py-2 px-3">
                            {d.scoreOverwriteBlocked ? (
                              <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {d.protectionMessage}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">
                                {d.protectionMessage}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE DRIVE 6-FOLDER HIERARCHY */}
        {activeTab === "DRIVE" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Cấu trúc Thư mục Chuẩn 6 Nhánh trên Google Drive (<code>EDUCARE_AI/</code>)
                </h2>
                <p className="text-xs text-ink-muted">
                  Tất cả <code>folderId</code> được lưu cố định trong bảng <code>DriveFolderNode</code> của Supabase để truy xuất chính xác mà không phụ thuộc đường dẫn.
                </p>
              </div>
              <button
                onClick={() =>
                  runWorkspaceAction("PROVISION_DRIVE_6_FOLDERS", { accountMode })
                }
                disabled={actionLoading !== null}
                className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Tự động Tạo & Đồng bộ 21 Thư mục Chuẩn
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Visual ASCII Tree from User Specification */}
              <div className="p-4 rounded-lg bg-slate-950 text-teal-300 font-mono text-xs leading-relaxed overflow-x-auto">
                <pre>{`EDUCARE_AI/
├── 01_QUAN_TRI/                [RESTRICTED_ADMIN_ONLY]
│   ├── Danh_sach_lop/
│   └── Bao_cao_tong_hop/
├── 02_HOC_LIEU/                [RESTRICTED_ADMIN_TEACHER]
│   ├── Toan/
│   ├── Ngu_van/
│   ├── Tin_hoc/
│   └── Khoa_hoc_tu_nhien/
├── 03_LOP_HOC/                 [SCOPED_CLASS_STUDENTS]
│   ├── Lop_6/
│   ├── Lop_7/
│   ├── Lop_8/
│   └── Lop_9/
├── 04_SAN_PHAM_SANG_TAO/       [CONTROLLED_VERSION_STORE]
│   ├── Tro_choi_HTML/
│   ├── Prompt_mau/
│   └── San_pham_da_duyet/
├── 05_TRACKING_REPORTS/        [RESTRICTED_ADMIN_TEACHER]
│   ├── Tracking_theo_lop/
│   └── Bao_cao_hoc_ky/
└── 06_BACKUP/                  [PRIVATE_NO_PUBLIC_LINK]
    ├── Database_Encrypted/
    └── Metadata_Exports/`}</pre>
              </div>

              {/* Persisted DriveFolderNode Table from Supabase */}
              <div className="overflow-x-auto border border-border rounded-lg max-h-[420px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-canvas border-b border-border">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Đường dẫn logic</th>
                      <th className="py-2 px-3 font-semibold">Google Drive folderId (Supabase)</th>
                      <th className="py-2 px-3 font-semibold">Phân quyền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(driveNodes.length > 0
                      ? driveNodes
                      : workspaceData?.driveFolderTreeTemplate || []
                    ).map((node: any, idx: number) => (
                      <tr key={idx} className="hover:bg-canvas/60">
                        <td className="py-2 px-3 font-mono font-semibold text-ink">
                          {node.folderPath}
                        </td>
                        <td className="py-2 px-3 font-mono text-brand-teal">
                          {node.googleFolderId || `Chờ khởi tạo (${node.folderCode})`}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              node.permissionScope === "RESTRICTED_ADMIN_ONLY"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : node.permissionScope === "SCOPED_CLASS_STUDENTS"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {node.permissionScope}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ENCRYPTED DATABASE BACKUP & RESTORE DRILL */}
        {activeTab === "BACKUP" && (
          <div className="space-y-6">
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    Sao lưu Cơ sở dữ liệu Độc lập (AES-256-GCM) & Diễn tập Khôi phục (Restore Drill)
                  </h2>
                  <p className="text-xs text-ink-muted max-w-3xl">
                    Google Sheets chỉ phục vụ tra cứu/tracking và <strong>không thay thế bản backup PostgreSQL/DB</strong>. Hệ thống tạo bản sao lưu mã hóa độc lập hằng ngày, kiểm tra băm <code>SHA-256</code> hằng tuần và hỗ trợ diễn tập khôi phục định kỳ.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runWorkspaceAction("CREATE_ENCRYPTED_BACKUP")}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    Tạo Bản Backup Mã hóa Mới
                  </button>
                  <button
                    onClick={() => runWorkspaceAction("VERIFY_RESTORE_DRILL")}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 rounded-button bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Thử Khôi phục Dữ liệu (Restore Drill)
                  </button>
                </div>
              </div>

              {restoreDrillResult && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{restoreDrillResult.message}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-emerald-800 font-mono">
                    {Object.entries(restoreDrillResult.tableRowCounts || {}).map(
                      ([tbl, cnt]: any) => (
                        <span
                          key={tbl}
                          className="px-2 py-0.5 rounded bg-white border border-emerald-200"
                        >
                          {tbl}: {cnt} bản ghi
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas border-b border-border text-ink-muted">
                      <th className="py-2.5 px-3 font-semibold">Mã Backup</th>
                      <th className="py-2.5 px-3 font-semibold">Thuật toán & Đường dẫn Drive</th>
                      <th className="py-2.5 px-3 font-semibold">SHA-256 Checksum</th>
                      <th className="py-2.5 px-3 font-semibold">Toàn vẹn</th>
                      <th className="py-2.5 px-3 font-semibold">Trạng thái Restore Drill</th>
                      <th className="py-2.5 px-3 font-semibold">Thời gian tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {backupRecords.length > 0 ? (
                      backupRecords.map((bk: any) => (
                        <tr key={bk.id} className="hover:bg-canvas/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-ink">
                            {bk.backupCode}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-brand-teal">
                              {bk.encryptionAlgorithm}
                            </span>{" "}
                            • <code className="text-ink-muted">{bk.driveFolderPath}</code>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-ink-muted">
                            {bk.sha256Checksum.slice(0, 20)}...
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              {bk.integrityStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold ${
                                bk.restoreDrillStatus === "DRILL_PASSED"
                                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {bk.restoreDrillStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-ink-muted">
                            {new Date(bk.createdAt).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-ink-muted">
                          Chưa có bản ghi backup nào. Bấm &ldquo;Tạo Bản Backup Mã hóa Mới&rdquo; để tạo snapshot đầu tiên.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GOOGLE CLASSROOM */}
        {activeTab === "CLASSROOM" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <h2 className="text-lg font-bold text-ink">
              Đồng bộ Bài tập Google Classroom (Chống Trùng lặp Idempotent)
            </h2>
            <div className="space-y-3">
              {(workspaceData?.assignments || []).map((asg: any) => (
                <div
                  key={asg.id}
                  className="p-4 rounded-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-teal">
                        {asg.subject?.name} • Lớp {asg.schoolClass?.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-canvas border border-border font-mono">
                        {asg.classroomCourseworkId || "Chưa gắn Coursework ID"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-ink mt-1">{asg.title}</h3>
                  </div>
                  <button
                    onClick={() =>
                      runWorkspaceAction("SYNC_CLASSROOM", { assignmentId: asg.id })
                    }
                    disabled={actionLoading !== null}
                    className="px-3.5 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover"
                  >
                    {asg.classroomCourseworkId
                      ? "Cập nhật Idempotent Classroom"
                      : "Phát hành lên Classroom"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: GOOGLE DOCS TEMPLATES */}
        {activeTab === "DOCS" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <h2 className="text-lg font-bold text-ink">
              Khởi tạo Giáo án & Đề kiểm tra từ Mẫu Google Docs Chuẩn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Tên tài liệu Google Docs
                </label>
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-button border border-border text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Môn học & Khối lớp
                </label>
                <input
                  value={docSubject}
                  onChange={(e) => setDocSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-button border border-border text-xs"
                />
              </div>
            </div>
            <button
              onClick={() =>
                runWorkspaceAction("CREATE_DOC_TEMPLATE", {
                  title: docTitle,
                  templateType: docType,
                  subjectName: docSubject,
                  topicName: docTopic,
                  gradeLevel: 7,
                })
              }
              disabled={actionLoading !== null}
              className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold"
            >
              Nhân bản Mẫu Google Docs & Lưu fileId vào Supabase
            </button>
            {createdDoc && (
              <div className="p-4 rounded-lg bg-canvas border border-border text-xs space-y-1">
                <p className="font-bold text-ink">
                  Đã tạo: {createdDoc.title} (Google Doc ID: <code>{createdDoc.docId}</code>)
                </p>
                <p className="text-ink-muted">
                  Quyền truy cập: {createdDoc.metadata?.accessRole}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: GOOGLE CALENDAR */}
        {activeTab === "CALENDAR" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <h2 className="text-lg font-bold text-ink">
              Đồng bộ Lịch Kiểm tra & Nhắc hạn nộp Google Calendar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Tiêu đề sự kiện hạn nộp
                </label>
                <input
                  value={calTitle}
                  onChange={(e) => setCalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-button border border-border text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Lớp áp dụng
                </label>
                <input
                  value={calClass}
                  onChange={(e) => setCalClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-button border border-border text-xs"
                />
              </div>
            </div>
            <button
              onClick={() =>
                runWorkspaceAction("CREATE_CALENDAR_EVENT", {
                  title: calTitle,
                  className: calClass,
                  reminder1Day: remind1Day,
                  reminder1Hour: remind1Hour,
                })
              }
              disabled={actionLoading !== null}
              className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold"
            >
              Tạo Sự kiện Lịch Lớp {calClass}
            </button>
          </div>
        )}

        {/* TAB 8: SYNC LOGS */}
        {activeTab === "LOGS" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <h2 className="text-lg font-bold text-ink">
              Nhật ký Đồng bộ Liên thông (Supabase ↔ Google Sheets / Drive / Classroom)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-canvas text-ink-muted">
                    <th className="py-2 px-3">Thời gian</th>
                    <th className="py-2 px-3">Dịch vụ</th>
                    <th className="py-2 px-3">Thao tác</th>
                    <th className="py-2 px-3">Resource ID (Supabase Metadata)</th>
                    <th className="py-2 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(workspaceData?.syncLogs || []).map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-2 px-3 text-ink-muted">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2 px-3 font-bold text-brand-teal">{log.service}</td>
                      <td className="py-2 px-3 font-mono text-ink">{log.action}</td>
                      <td className="py-2 px-3 font-mono text-ink-muted">{log.resourceId}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

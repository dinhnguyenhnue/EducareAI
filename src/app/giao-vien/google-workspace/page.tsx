"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  ExternalLink,
  ShieldCheck,
  Trash2,
  Database,
} from "lucide-react";

export default function TeacherGoogleWorkspacePage() {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "DRIVE" | "DOCS" | "SHEETS" | "CLASSROOM" | "CALENDAR" | "LOGS"
  >("OVERVIEW");

  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [sheetsPreview, setSheetsPreview] = useState<any>(null);
  const [createdDoc, setCreatedDoc] = useState<any>(null);

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
        if (action === "SYNC_SHEETS" && result.data?.sheetPayloads) {
          setSheetsPreview(result.data.sheetPayloads);
        }
        if (action === "CREATE_DOC_TEMPLATE" && result.data) {
          setCreatedDoc(result.data);
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

  const isConnected = workspaceData?.connection?.status === "CONNECTED";
  let scopesList: string[] = [];
  try {
    if (workspaceData?.connection?.scopesGranted) {
      scopesList = JSON.parse(workspaceData.connection.scopesGranted);
    }
  } catch (e) {}

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">
                Google Workspace Integration Center (Phase 2)
              </h1>
              <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2.5 py-0.5 rounded">
                OAuth 2.0 & Real Sync Engine
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Điều phối kết nối Google Drive, Docs, Sheets, Classroom và Calendar với nguyên tắc PostgreSQL là nguồn dữ liệu gốc duy nhất.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="px-3 py-2 rounded-button bg-surface border border-border text-xs font-semibold text-ink hover:bg-canvas transition-colors"
            >
              Chính sách OAuth & Privacy
            </Link>
            <button
              onClick={() => runWorkspaceAction("SYNC_SHEETS")}
              disabled={actionLoading !== null}
              className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đồng bộ nhanh Sheets</span>
            </button>
          </div>
        </div>

        {/* Feedback Toast Banner */}
        {feedbackMsg && (
          <div className="p-4 rounded-panel bg-status-success-soft border border-status-success/40 flex items-center justify-between text-xs text-status-success font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold px-2">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3 text-xs">
          {[
            { id: "OVERVIEW", label: "Tổng quan & OAuth", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: "DRIVE", label: "1. Google Drive (10 Thư mục)", icon: <FolderOpen className="w-3.5 h-3.5" /> },
            { id: "DOCS", label: "2. Google Docs (Template)", icon: <FileText className="w-3.5 h-3.5" /> },
            { id: "SHEETS", label: "3. Google Sheets (5 Bảng)", icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
            { id: "CLASSROOM", label: "4. Classroom (Giao bài)", icon: <Layers className="w-3.5 h-3.5" /> },
            { id: "CALENDAR", label: "5. Calendar (Nhắc lịch)", icon: <Calendar className="w-3.5 h-3.5" /> },
            { id: "LOGS", label: `Nhật ký Sync (${workspaceData?.syncLogs?.length || 0})`, icon: <Database className="w-3.5 h-3.5" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-2 rounded-button font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === t.id
                  ? "bg-brand-teal text-white shadow-sm"
                  : "bg-surface text-ink-muted hover:text-ink border border-border"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & OAUTH */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    isConnected
                      ? "bg-status-success-soft text-status-success"
                      : "bg-status-warning-soft text-status-warning"
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink">
                      Tài khoản Google: {workspaceData?.connection?.googleEmail || "Chưa liên kết"}
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        isConnected
                          ? "bg-status-success-soft text-status-success"
                          : "bg-status-warning-soft text-status-warning"
                      }`}
                    >
                      {isConnected ? "CONNECTED (OAuth 2.0)" : "REVOKED / DISCONNECTED"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Quyền đã cấp ({scopesList.length} scopes):{" "}
                    <span className="font-mono text-ink">
                      {scopesList.length > 0 ? scopesList.join(", ") : "Không có quyền nào"}
                    </span>
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    Chế độ vận hành:{" "}
                    {workspaceData?.oauthConfig?.isConfigured
                      ? "Google Cloud Live Credentials"
                      : "Local Database & Sandbox Sync (Sẵn sàng nhận GOOGLE_CLIENT_ID trong .env)"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isConnected ? (
                  <button
                    onClick={handleRevokeOAuth}
                    disabled={actionLoading !== null}
                    className="px-3.5 py-2 rounded-button bg-status-danger-soft text-status-danger border border-status-danger/30 text-xs font-semibold hover:bg-status-danger hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Thu hồi quyền (Revoke)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReconnectOAuth}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors"
                  >
                    Kết nối lại Google OAuth
                  </button>
                )}
                <Link
                  href="/dang-nhap"
                  className="px-3.5 py-2 rounded-button bg-canvas border border-border text-xs font-semibold text-ink hover:bg-surface-muted transition-colors"
                >
                  Cấu hình Scopes
                </Link>
              </div>
            </div>

            {/* 5 Service Cards Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  tab: "DRIVE",
                  title: "1. Google Drive API v3",
                  desc: "Quản lý 10 thư mục chuẩn UNIGO, quyền tối thiểu drive.file, render PDF an toàn không bị chặn cookie.",
                  badge: "10 Thư mục chuẩn",
                },
                {
                  tab: "DOCS",
                  title: "2. Google Docs API v1",
                  desc: "Tạo đề thi, giáo án, phiếu học tập từ mẫu qua cơ chế 2 bước: Drive files.copy + Docs replaceAllText.",
                  badge: "Template Engine",
                },
                {
                  tab: "SHEETS",
                  title: "3. Google Sheets API v4",
                  desc: "Xuất báo cáo 5 bảng cấu trúc bằng values.batchUpdate (bảo vệ hạn ngạch 60 req/phút).",
                  badge: "Batch Sync 5 Bảng",
                },
                {
                  tab: "CLASSROOM",
                  title: "4. Google Classroom API",
                  desc: "Đồng bộ bài tập Idempotent (chống tạo trùng) với chế độ STUDENT_COPY và cập nhật điểm.",
                  badge: "STUDENT_COPY",
                },
                {
                  tab: "CALENDAR",
                  title: "5. Google Calendar API v3",
                  desc: "Tạo sự kiện hạn nộp bài và lịch thi với nhắc việc tự động trước 1 ngày & 1 giờ (Opt-in).",
                  badge: "Auto Reminders",
                },
              ].map((card) => (
                <div
                  key={card.tab}
                  className="p-5 rounded-panel bg-surface border border-border shadow-card flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                        {card.badge}
                      </span>
                      <span className="text-[11px] text-status-success font-semibold">● Sẵn sàng</span>
                    </div>
                    <h3 className="text-sm font-bold text-ink">{card.title}</h3>
                    <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{card.desc}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab(card.tab as any)}
                    className="w-full py-2 rounded-button bg-canvas hover:bg-surface-muted border border-border text-xs font-semibold text-brand-teal transition-colors"
                  >
                    Mở công cụ điều khiển →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE DRIVE */}
        {activeTab === "DRIVE" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
              <div>
                <h2 className="text-base font-bold text-ink">
                  Hệ thống Lưu trữ Google Drive — 10 Nhóm Thư mục Chuẩn UNIGO
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Sử dụng scope <code>drive.file</code> (chỉ quản lý tệp do ứng dụng tạo, bảo vệ tuyệt đối tệp riêng tư khác của giáo viên và học sinh).
                </p>
              </div>
              <button
                onClick={() => runWorkspaceAction("INIT_DRIVE_FOLDERS")}
                disabled={actionLoading !== null}
                className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shrink-0"
              >
                {actionLoading === "INIT_DRIVE_FOLDERS"
                  ? "Đang khởi tạo..."
                  : "Đồng bộ cấu trúc 10 thư mục Drive"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(workspaceData?.driveFolders || []).map((f: any) => (
                <div
                  key={f.code}
                  className="p-3.5 rounded-button bg-canvas border border-border space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <FolderOpen className="w-4 h-4 text-brand-teal" />
                    <span className="text-[10px] font-mono text-ink-muted">{f.code}</span>
                  </div>
                  <h4 className="text-xs font-bold text-ink">{f.name}</h4>
                  <p className="text-[11px] text-ink-muted leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE DOCS TEMPLATE ENGINE */}
        {activeTab === "DOCS" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <h2 className="text-base font-bold text-ink pb-2 border-b border-border">
                Khởi tạo Tài liệu Google Docs từ Mẫu (Drive Copy + ReplaceAllText)
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-ink block mb-1">Loại mẫu chuẩn UNIGO:</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink"
                  >
                    <option value="EXAM">Mẫu Đề kiểm tra định kỳ (EXAM)</option>
                    <option value="LESSON_PLAN">Mẫu Kế hoạch bài dạy / Giáo án (LESSON_PLAN)</option>
                    <option value="WORKSHEET">Mẫu Phiếu học tập thực hành (WORKSHEET)</option>
                    <option value="RUBRIC_GUIDE">Mẫu Hướng dẫn chấm & Đáp án (RUBRIC_GUIDE)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-ink block mb-1">Tên tài liệu cần tạo:</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-ink block mb-1">Môn học & Khối:</label>
                    <input
                      type="text"
                      value={docSubject}
                      onChange={(e) => setDocSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-ink block mb-1">Chủ đề bài học:</label>
                    <input
                      type="text"
                      value={docTopic}
                      onChange={(e) => setDocTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink"
                    />
                  </div>
                </div>

                <button
                  onClick={() =>
                    runWorkspaceAction("CREATE_DOC_TEMPLATE", {
                      title: docTitle,
                      templateType: docType,
                      subjectName: docSubject,
                      gradeLevel: 7,
                      topicName: docTopic,
                    })
                  }
                  disabled={actionLoading !== null}
                  className="w-full py-2.5 rounded-button bg-brand-teal text-white font-semibold hover:bg-brand-teal-hover transition-colors"
                >
                  {actionLoading === "CREATE_DOC_TEMPLATE"
                    ? "Đang nhân bản mẫu và điền metadata..."
                    : "Tạo Google Docs từ Mẫu chuẩn"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide pb-2 border-b border-border">
                Metadata & Trạng thái Tài liệu vừa tạo
              </h3>
              {createdDoc ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-button bg-brand-teal-soft/50 border border-brand-teal/30 space-y-1">
                    <span className="font-bold text-brand-teal block">
                      Document ID: {createdDoc.docId}
                    </span>
                    <p className="text-ink font-semibold">{createdDoc.title}</p>
                    <p className="text-ink-muted">
                      Phiên bản: {createdDoc.metadata.version} • Quyền: {createdDoc.metadata.accessRole}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-button bg-canvas border border-border space-y-1.5">
                    <span className="font-bold text-ink block">
                      Các trường Placeholder đã tự động điền qua `replaceAllText`:
                    </span>
                    <ul className="font-mono text-[11px] text-ink-muted space-y-1">
                      {createdDoc.replacedPlaceholders.map((item: string, idx: number) => (
                        <li key={idx}>✓ {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-muted py-8 text-center">
                  Nhấn nút &ldquo;Tạo Google Docs từ Mẫu chuẩn&rdquo; ở bên trái để xem kết quả sinh tài liệu và metadata.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: GOOGLE SHEETS 5 TABLES BATCH SYNC */}
        {activeTab === "SHEETS" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
              <div>
                <h2 className="text-base font-bold text-ink">
                  Đồng bộ 5 Bảng dữ liệu Học tập sang Google Sheets (values.batchUpdate)
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  PostgreSQL là cơ sở dữ liệu gốc; Sheets nhận dữ liệu báo cáo một chiều có kiểm soát quyền, gộp toàn bộ trong 1 request để tránh lỗi HTTP 429 (60 req/phút).
                </p>
              </div>
              <button
                onClick={() => runWorkspaceAction("SYNC_SHEETS")}
                disabled={actionLoading !== null}
                className="px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shrink-0"
              >
                {actionLoading === "SYNC_SHEETS"
                  ? "Đang xuất 5 bảng..."
                  : "Xuất & Đồng bộ 5 Bảng sang Sheets ngay"}
              </button>
            </div>

            {sheetsPreview ? (
              <div className="space-y-4">
                {Object.values(sheetsPreview).map((sheet: any, idx: number) => (
                  <div key={idx} className="border border-border rounded-button overflow-hidden">
                    <div className="bg-canvas px-4 py-2 border-b border-border flex items-center justify-between text-xs font-bold text-ink">
                      <span>{sheet.sheetName}</span>
                      <span className="text-[11px] font-mono text-brand-teal">
                        {sheet.rows.length} dòng dữ liệu
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-surface-muted/50 text-ink-muted">
                            {sheet.headers.map((h: string, i: number) => (
                              <th key={i} className="py-2 px-3 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {sheet.rows.map((row: string[], rIdx: number) => (
                            <tr key={rIdx}>
                              {row.map((cell: string, cIdx: number) => (
                                <td key={cIdx} className="py-2 px-3 text-ink">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-canvas rounded-panel border border-border text-xs text-ink-muted">
                Nhấn nút <strong>&ldquo;Xuất & Đồng bộ 5 Bảng sang Sheets ngay&rdquo;</strong> để trích xuất trực tiếp từ CSDL và xem trước toàn bộ 5 bảng cấu trúc (Học sinh, Giáo viên, Kết quả, Năng lực, Hoạt động).
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GOOGLE CLASSROOM */}
        {activeTab === "CLASSROOM" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <div className="pb-3 border-b border-border">
              <h2 className="text-base font-bold text-ink">
                Đồng bộ Bài tập hai chiều với Google Classroom (Chống tạo trùng Idempotent)
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Hỗ trợ đính kèm tài liệu Google Drive với chế độ <code>STUDENT_COPY</code> (tạo bản sao riêng cho mỗi học sinh) và đồng bộ trạng thái bài nộp.
              </p>
            </div>

            <div className="divide-y divide-border">
              {(workspaceData?.assignments || []).map((a: any) => (
                <div
                  key={a.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink text-sm">{a.title}</span>
                      <span className="px-2 py-0.5 rounded bg-brand-teal-soft text-brand-teal font-semibold">
                        Lớp {a.schoolClass?.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-canvas border border-border font-mono">
                        Status: {a.syncStatus}
                      </span>
                    </div>
                    <p className="text-ink-muted">
                      Classroom CourseWork ID:{" "}
                      <code className="font-mono text-ink">
                        {a.classroomCourseworkId || "Chưa phát hành sang Classroom"}
                      </code>{" "}
                      • Số bài đã nộp: {a.submissions?.length || 0}
                    </p>
                  </div>

                  <button
                    onClick={() => runWorkspaceAction("SYNC_CLASSROOM", { assignmentId: a.id })}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 rounded-button bg-brand-teal text-white font-semibold hover:bg-brand-teal-hover transition-colors shrink-0"
                  >
                    {a.classroomCourseworkId
                      ? "Đồng bộ cập nhật (Idempotent)"
                      : "Phát hành sang Classroom"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: GOOGLE CALENDAR */}
        {activeTab === "CALENDAR" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card max-w-2xl space-y-4">
            <h2 className="text-base font-bold text-ink pb-2 border-b border-border">
              Tạo Sự kiện Hạn nộp & Lịch kiểm tra trên Google Calendar
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink block mb-1">Tiêu đề sự kiện nhắc lịch:</label>
                <input
                  type="text"
                  value={calTitle}
                  onChange={(e) => setCalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink"
                />
              </div>
              <div>
                <label className="font-bold text-ink block mb-1">Lớp áp dụng (Secondary Calendar):</label>
                <input
                  type="text"
                  value={calClass}
                  onChange={(e) => setCalClass(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink"
                />
              </div>
              <div className="space-y-2 pt-1">
                <span className="font-bold text-ink block">Thiết lập nhắc việc tự động:</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remind1Day}
                    onChange={(e) => setRemind1Day(e.target.checked)}
                    className="accent-brand-teal"
                  />
                  <span>Nhắc trước 1 ngày (1440 phút) qua Email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remind1Hour}
                    onChange={(e) => setRemind1Hour(e.target.checked)}
                    className="accent-brand-teal"
                  />
                  <span>Nhắc trước 1 giờ (60 phút) qua Popup thông báo</span>
                </label>
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
                className="px-5 py-2.5 rounded-button bg-brand-teal text-white font-semibold hover:bg-brand-teal-hover transition-colors"
              >
                Đồng bộ sự kiện lên Google Calendar
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: LIVE SYNC LOGS */}
        {activeTab === "LOGS" && (
          <div className="p-6 rounded-panel bg-surface border border-border shadow-card space-y-4">
            <h2 className="text-base font-bold text-ink pb-2 border-b border-border">
              Nhật ký Đồng bộ Google Workspace (Sync Logs từ CSDL)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-canvas font-bold text-ink">
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Dịch vụ</th>
                    <th className="py-2.5 px-3">Thao tác API</th>
                    <th className="py-2.5 px-3">Resource ID</th>
                    <th className="py-2.5 px-3">Người thực hiện</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(workspaceData?.syncLogs || []).map((log: any) => (
                    <tr key={log.id} className="hover:bg-canvas/50">
                      <td className="py-2.5 px-3 font-mono text-ink-muted">
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-brand-teal">{log.service}</td>
                      <td className="py-2.5 px-3 font-mono text-ink">{log.action}</td>
                      <td className="py-2.5 px-3 font-mono text-ink-muted">{log.resourceId}</td>
                      <td className="py-2.5 px-3 text-ink">{log.user?.fullName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-status-success-soft text-status-success font-semibold text-[11px]">
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

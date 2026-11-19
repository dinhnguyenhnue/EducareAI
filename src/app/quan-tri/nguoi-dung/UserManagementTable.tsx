"use client";

import React, { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Search,
  Download,
  UserPlus,
  AlertCircle,
  Edit3,
  KeyRound,
  Copy,
} from "lucide-react";
import { Modal } from "@/components/ui";

interface IssuedCredentialItem {
  studentCode: string;
  fullName: string;
  className: string;
  temporaryPassword: string;
}

export function UserManagementTable({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Excel Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [passwordMode, setPasswordMode] = useState<"CUSTOM_INITIAL" | "RANDOM">("RANDOM");
  const [customInitialPassword, setCustomInitialPassword] = useState("");

  // Edit / Create User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("STUDENT");
  const [newStudentCode, setNewStudentCode] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("7A1");
  const [userActionError, setUserActionError] = useState<string | null>(null);

  // One-time Issued Credentials State (shown only once after create/import/reset)
  const [oneTimeCredentials, setOneTimeCredentials] = useState<
    IssuedCredentialItem[] | null
  >(null);
  const [oneTimeTitle, setOneTimeTitle] = useState<string>("");
  const [copiedNotice, setCopiedNotice] = useState(false);

  const downloadCredentialsCsv = (items: IssuedCredentialItem[]) => {
    const header = "MaDangNhap_MaHS,HoVaTen,Lop,MatKhauTamMotLan\n";
    const body = items
      .map(
        (c) =>
          `"${c.studentCode}","${c.fullName.replace(/"/g, '""')}","${c.className}","${c.temporaryPassword}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MatKhauTam_HocSinh_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetUserPassword = async (u: any) => {
    setUserActionError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "RESET_USER_PASSWORD",
        userId: u.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUserActionError(data.error || "Không thể đặt lại mật khẩu tạm.");
      return;
    }
    setUsers((prev) =>
      prev.map((item) => (item.id === data.user.id ? data.user : item))
    );
    if (data.issuedCredential) {
      setOneTimeTitle(
        `Đã cấp lại mật khẩu tạm một lần cho ${data.issuedCredential.fullName}`
      );
      setOneTimeCredentials([data.issuedCredential]);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.studentProfile?.studentCode || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleLoadWorkspaceExcel = async () => {
    setIsLoadingPreview(true);
    setImportError(null);
    setImportReport(null);
    try {
      const res = await fetch("/api/admin/import-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PREVIEW_WORKSPACE_FILE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || "Không thể đọc file Excel");
        return;
      }
      setPreviewData(data.preview);
      setExistingCodes(data.existingCodesInDb || []);
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFileUploadChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingPreview(true);
    setImportError(null);
    setImportReport(null);

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const res = await fetch("/api/admin/import-students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "PREVIEW_UPLOAD",
            fileName: file.name,
            csvText: text,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPreviewData(data.preview);
        setExistingCodes(data.existingCodesInDb || []);
      } else {
        const arrayBuf = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const res = await fetch("/api/admin/import-students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "PREVIEW_UPLOAD",
            fileName: file.name,
            fileBase64: base64,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setPreviewData(data.preview);
        setExistingCodes(data.existingCodesInDb || []);
      }
    } catch (err: any) {
      setImportError(err.message || "Lỗi phân tích file tải lên");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData?.validRows?.length) return;
    if (
      passwordMode === "CUSTOM_INITIAL" &&
      customInitialPassword.trim().length < 8
    ) {
      setImportError(
        "Mật khẩu khởi tạo chung phải có tối thiểu 8 ký tự (nên gồm chữ hoa, chữ thường, số và ký tự đặc biệt)."
      );
      return;
    }
    setIsCommitting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/admin/import-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMMIT_IMPORT",
          rowsToCommit: previewData.validRows,
          passwordMode,
          customInitialPassword:
            passwordMode === "CUSTOM_INITIAL"
              ? customInitialPassword.trim()
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || "Lỗi ghi dữ liệu vào CSDL");
        return;
      }
      setImportReport(data.summary);
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUserActionError(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_USER",
        userId: editingUser.id,
        fullName: editingUser.fullName,
        role: editingUser.role,
        isActive: editingUser.isActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUserActionError(data.error || "Không thể cập nhật người dùng");
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === data.user.id ? data.user : u))
    );
    setEditingUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CREATE_USER",
        fullName: newUserName,
        email: newUserEmail,
        role: newUserRole,
        studentCode: newUserRole === "STUDENT" ? newStudentCode : undefined,
        className: newUserRole === "STUDENT" ? newStudentClass : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUserActionError(data.error || "Không thể tạo người dùng");
      return;
    }
    setUsers((prev) => [data.user, ...prev]);
    setNewUserName("");
    setNewUserEmail("");
    setNewStudentCode("");
    setShowCreateModal(false);
    if (data.issuedCredential) {
      setOneTimeTitle(
        `Đã tạo tài khoản học sinh / người dùng (${data.issuedCredential.studentCode})`
      );
      setOneTimeCredentials([data.issuedCredential]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="p-4 rounded-panel bg-surface border border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, mã HS hoặc email..."
              className="w-full pl-9 pr-3 py-2 bg-canvas border border-border rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-canvas border border-border rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
          >
            <option value="ALL">Tất cả vai trò ({users.length})</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SCHOOL_ADMIN">School Admin</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Học sinh</option>
            <option value="PARENT">Phụ huynh</option>
            <option value="COMMUNITY_USER">Cộng đồng</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setUserActionError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-canvas hover:bg-surface-muted border border-border text-ink text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-ocean-600" />
            <span>Thêm tài khoản</span>
          </button>

          <button
            type="button"
            data-testid="open-excel-import-btn"
            onClick={() => {
              setShowImportModal(true);
              setPreviewData(null);
              setImportReport(null);
              setImportError(null);
            }}
            className="px-3.5 py-2 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập danh sách Học sinh UNIGO (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-panel bg-surface border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-canvas text-ink font-bold">
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Vai trò RBAC</th>
                <th className="py-3 px-4">Email / Định danh</th>
                <th className="py-3 px-4">Thông tin Lớp / Chuyên môn</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 px-4 text-center text-xs text-ink-muted"
                  >
                    Chưa có người dùng nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => {
                let info = "Toàn quyền hệ thống";
                if (u.role === "STUDENT") {
                  info = `Lớp ${
                    u.studentProfile?.schoolClass?.name ?? "Chưa xếp lớp"
                  } • Mã HS: ${u.studentProfile?.studentCode ?? "N/A"}`;
                } else if (u.role === "TEACHER") {
                  info = u.teacherProfile?.specialization || "Giáo viên bộ môn";
                } else if (u.role === "PARENT") {
                  info = "Phụ huynh học sinh (Đã liên kết)";
                } else if (u.role === "SCHOOL_ADMIN") {
                  info = "Ban Giám hiệu / Tổ chuyên môn THCS";
                }

                const isNoEmailInternal =
                  !u.email.includes("@") ||
                  u.email.endsWith("@no-email.internal.unigo");

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-canvas/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-ink">
                      {u.fullName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-mono font-semibold bg-ocean-50 text-ocean-700 border border-ocean-200 px-2.5 py-0.5 rounded-full">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-muted font-mono text-[11px]">
                      {isNoEmailInternal ? (
                        <span className="text-ink font-semibold">
                          Mã ĐN: {u.studentProfile?.studentCode || u.email}{" "}
                          <span className="text-ink-muted font-normal italic">
                            (Không dùng email)
                          </span>
                        </span>
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-ink">{info}</td>
                    <td className="py-3.5 px-4">
                      {u.accountStatus === "MUST_CHANGE_PASSWORD" ? (
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <KeyRound className="w-3 h-3" />
                          Đổi MK lần đầu
                        </span>
                      ) : u.accountStatus === "PENDING_ACTIVATION" ? (
                        <span className="text-[11px] font-semibold text-status-warning bg-status-warning-soft px-2 py-0.5 rounded">
                          Chờ kích hoạt
                        </span>
                      ) : u.isActive ? (
                        <span className="text-[11px] font-semibold text-status-success bg-status-success-soft px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-status-danger bg-status-danger-soft px-2 py-0.5 rounded">
                          Tạm khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleResetUserPassword(u)}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-1"
                          title="Cấp lại mật khẩu tạm một lần và buộc đổi ở lần đăng nhập kế tiếp"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Đặt lại MK tạm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserActionError(null);
                            setEditingUser({ ...u });
                          }}
                          className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Phân quyền</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nhập danh sách Học sinh UNIGO (Section IX) */}
      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title={
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-ocean-600 shrink-0" />
            <span>Nhập Danh sách Học sinh Năm học 2026 – 2027 (Khối 6, 7, 8)</span>
          </span>
        }
        description="Tự động phân tích các sheet Khối 6, 7, 8 • Chuẩn hóa mã HS • Kiểm tra trùng lặp Idempotent • Không tự bịa email/điểm số"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          {importError && (
            <div role="alert" className="p-3 rounded bg-status-danger-soft text-status-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importReport ? (
            <div
              data-testid="import-commit-report"
              className="p-5 rounded-2xl bg-status-success-soft/50 border border-status-success/30 space-y-3 text-xs"
            >
              <div className="flex items-center gap-2 text-status-success font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  Đã hoàn tất Import Idempotent vào CSDL Năm học{" "}
                  {importReport.academicYear}!
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded bg-surface border border-border">
                  <span className="text-ink-muted block">Thêm mới:</span>
                  <span className="text-lg font-bold text-status-success">
                    {importReport.createdCount} học sinh
                  </span>
                </div>
                <div className="p-3 rounded bg-surface border border-border">
                  <span className="text-ink-muted block">
                    Đã tồn tại (Giữ nguyên):
                  </span>
                  <span className="text-lg font-bold text-ocean-600">
                    {importReport.skippedDuplicateCount ?? importReport.updatedIdempotentCount} học sinh
                  </span>
                </div>
                <div className="p-3 rounded bg-surface border border-border">
                  <span className="text-ink-muted block">Số dòng lỗi:</span>
                  <span className="text-lg font-bold text-status-danger">
                    {importReport.failedCount} dòng
                  </span>
                </div>
                <div className="p-3 rounded bg-surface border border-border">
                  <span className="text-ink-muted block">Lớp học đồng bộ:</span>
                  <span className="text-xs font-bold text-ink mt-1 block">
                    {importReport.classesAffected.join(", ")}
                  </span>
                </div>
              </div>
              {importReport.issuedCredentials?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-900">
                      Mật khẩu tạm một lần ({importReport.issuedCredentials.length} tài khoản mới) — Chỉ hiển thị 1 lần duy nhất!
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadCredentialsCsv(importReport.issuedCredentials)
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải CSV Mật khẩu tạm</span>
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-amber-200 rounded bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-amber-100/60 border-b border-amber-200 font-bold text-amber-950">
                          <th className="py-1.5 px-2.5">Mã HS (Tên ĐN)</th>
                          <th className="py-1.5 px-2.5">Họ và Tên</th>
                          <th className="py-1.5 px-2.5">Lớp</th>
                          <th className="py-1.5 px-2.5">Mật khẩu tạm (1 lần)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {importReport.issuedCredentials.map((cred: IssuedCredentialItem) => (
                          <tr key={cred.studentCode}>
                            <td className="py-1.5 px-2.5 font-mono font-bold text-ink">
                              {cred.studentCode}
                            </td>
                            <td className="py-1.5 px-2.5 text-ink">{cred.fullName}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-ocean-700">
                              {cred.className}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono font-bold text-amber-900">
                              {cred.temporaryPassword}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {importReport.rowErrors?.length > 0 && (
                <div className="p-3 rounded-xl bg-status-danger-soft border border-red-200 space-y-1">
                  <div className="font-bold text-status-danger">
                    Chi tiết dòng lỗi bị từ chối:
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-status-danger">
                    {importReport.rowErrors.map((err: any, idx: number) => (
                      <li key={idx}>
                        <strong>{err.studentCode}</strong>: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold"
                >
                  Đóng báo cáo
                </button>
              </div>
            </div>
          ) : !previewData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Load DANH SÁCH HỌC SINH NĂM HỌC 2026 - 2027.xlsx directly */}
                <div className="p-5 rounded-2xl bg-canvas border border-border flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-ocean-600 uppercase">
                      Cách 1: Từ thư mục dự án
                    </span>
                    <h4 className="text-sm font-bold text-ink mt-1">
                      DANH SÁCH HỌC SINH NĂM HỌC 2026 - 2027.xlsx
                    </h4>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Đọc trực tiếp workbook chuẩn của trường UNIGO (gồm 3 sheet Khối 6, Khối 7, Khối 8) để xem trước trước khi lưu vào CSDL.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="preview-workspace-excel-btn"
                    onClick={handleLoadWorkspaceExcel}
                    disabled={isLoadingPreview}
                    className="w-full py-2.5 px-4 rounded-xl bg-ocean-600 text-white text-xs font-semibold hover:bg-ocean-700 transition-colors"
                  >
                    {isLoadingPreview
                      ? "Đang phân tích cấu trúc sheet..."
                      : "Phân tích & Xem trước file Năm học 2026 - 2027"}
                  </button>
                </div>

                {/* Option 2: Upload custom .xlsx or .csv */}
                <label className="p-5 rounded-2xl bg-canvas border-2 border-dashed border-ocean-300 hover:bg-sky-50/40 transition-colors cursor-pointer flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-ocean-600 uppercase">
                      Cách 2: Tải file từ máy tính
                    </span>
                    <h4 className="text-sm font-bold text-ink mt-1">
                      Chọn file Excel (.xlsx) hoặc (.csv) bất kỳ
                    </h4>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Hệ thống tự động nhận diện các cột Mã HS, Họ tên, Lớp, Khối, Ngày sinh, Giới tính.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileUploadChange}
                    className="text-xs text-ink-muted"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-border">
                <span>Tải xuống file workbook mẫu 3 khối (Khối 6, 7, 8):</span>
                <a
                  href="/api/admin/import-students?download=template"
                  className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải DANH SÁCH HỌC SINH NĂM HỌC 2026 - 2027.xlsx</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Summary Banner */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-ocean-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-ink">
                      File: {previewData.fileName}
                    </span>
                    <span className="text-ink-muted ml-2">
                      (Sheets: {previewData.sheetsDetected.join(", ")})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-ocean-700">
                    <span>Khối 6: {previewData.gradeBreakdown.grade6} HS</span>
                    <span>•</span>
                    <span>Khối 7: {previewData.gradeBreakdown.grade7} HS</span>
                    <span>•</span>
                    <span>Khối 8: {previewData.gradeBreakdown.grade8} HS</span>
                  </div>
                </div>
                {previewData.classBreakdown && (
                  <div className="text-[11px] text-ink-muted">
                    Chi tiết theo lớp:{" "}
                    <span className="font-semibold text-ink">
                      {Object.entries(previewData.classBreakdown)
                        .map(([cls, cnt]) => `${cls}: ${cnt} HS`)
                        .join(" • ")}
                    </span>
                  </div>
                )}
                {previewData.skippedNonTargetSheets?.length > 0 && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                    Đã tự động bỏ qua {previewData.skippedNonTargetSheets.length} sheet không thuộc khối 6–8 (
                    {previewData.skippedNonTargetSheets.join(", ")}) — {previewData.skippedNonTargetCount || 0} dòng.
                  </div>
                )}
              </div>

              {/* Password Mode Selection */}
              <div className="p-3.5 rounded-xl bg-canvas border border-border space-y-2.5">
                <div className="font-bold text-ink">
                  Cơ chế cấp mật khẩu khởi tạo (Bắt buộc đổi ở lần đăng nhập đầu tiên):
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importPasswordMode"
                      checked={passwordMode === "RANDOM"}
                      onChange={() => setPasswordMode("RANDOM")}
                    />
                    <span>Sinh mật khẩu tạm ngẫu nhiên từng học sinh</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="importPasswordMode"
                      checked={passwordMode === "CUSTOM_INITIAL"}
                      onChange={() => setPasswordMode("CUSTOM_INITIAL")}
                    />
                    <span>Nhập mật khẩu khởi tạo chung cho đợt thí điểm</span>
                  </label>
                </div>
                {passwordMode === "CUSTOM_INITIAL" && (
                  <div className="pt-1">
                    <input
                      type="password"
                      value={customInitialPassword}
                      onChange={(e) => setCustomInitialPassword(e.target.value)}
                      placeholder="Nhập mật khẩu khởi tạo (tối thiểu 8 ký tự, băm scrypt an toàn)..."
                      className="w-full sm:w-96 px-3 py-2 rounded-lg border border-border bg-surface text-xs text-ink"
                    />
                  </div>
                )}
              </div>

              {/* Preview Table */}
              <div className="border border-border rounded-panel overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-canvas border-b border-border text-ink font-bold">
                      <th className="py-2 px-3">Sheet</th>
                      <th className="py-2 px-3">Mã HS (Chuẩn hóa)</th>
                      <th className="py-2 px-3">Họ và Tên</th>
                      <th className="py-2 px-3">Lớp</th>
                      <th className="py-2 px-3">Ngày sinh</th>
                      <th className="py-2 px-3">Email trong file</th>
                      <th className="py-2 px-3">Trạng thái CSDL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {previewData.validRows.map((r: any) => {
                      const exists = existingCodes.includes(r.studentCode);
                      return (
                        <tr key={r.studentCode}>
                          <td className="py-2 px-3 text-ink-muted">
                            {r.sheetName}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-ink">
                            {r.studentCode}
                          </td>
                          <td className="py-2 px-3 font-medium text-ink">
                            {r.fullName}
                          </td>
                          <td className="py-2 px-3 font-bold text-ocean-600">
                            {r.className}
                          </td>
                          <td className="py-2 px-3 text-ink-muted">
                            {r.dateOfBirth || "—"}
                          </td>
                          <td className="py-2 px-3 text-ink-muted">
                            {r.emailFromFile || (
                              <span className="italic text-[11px]">
                                Không có (Không tự bịa)
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {exists ? (
                              <span className="text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded">
                                Đã có (Giữ nguyên, không ghi đè)
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-status-success-soft text-status-success px-2 py-0.5 rounded">
                                Tạo mới
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {previewData.invalidRows?.length > 0 && (
                <div className="p-3 rounded-xl bg-status-danger-soft border border-red-200 space-y-1.5">
                  <div className="font-bold text-status-danger">
                    Phát hiện {previewData.invalidRows.length} dòng lỗi định dạng / trùng mã trong file (sẽ bị bỏ qua khi import):
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-status-danger max-h-28 overflow-y-auto">
                    {previewData.invalidRows.map((bad: any, idx: number) => (
                      <li key={idx}>
                        Sheet <strong>{bad.sheetName}</strong> (Dòng {bad.rowNumber} — {bad.studentCode || "Trống"}):{" "}
                        {bad.errors.join("; ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-2 rounded-xl bg-canvas hover:bg-surface-muted font-semibold text-ink"
                >
                  Chọn file khác
                </button>
                <button
                  type="button"
                  data-testid="commit-excel-import-btn"
                  onClick={handleCommitImport}
                  disabled={isCommitting}
                  className="px-5 py-2 rounded-xl bg-ocean-600 text-white font-semibold hover:bg-ocean-700 transition-colors shadow-sm"
                >
                  {isCommitting
                    ? "Đang lưu vào CSDL..."
                    : `Xác nhận Import (${previewData.validRows.length} học sinh)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Edit User Role & Status */}
      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Phân quyền & Cập nhật Tài khoản"
        maxWidth="max-w-md"
      >
        {editingUser && (
          <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
            {userActionError && (
              <div role="alert" className="p-2.5 rounded bg-status-danger-soft text-status-danger">
                {userActionError}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="edit-user-fullname" className="font-semibold text-ink block">
                Họ và Tên:
              </label>
              <input
                id="edit-user-fullname"
                type="text"
                value={editingUser.fullName}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, fullName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-user-role" className="font-semibold text-ink block">
                Vai trò Hệ thống (RBAC):
              </label>
              <select
                id="edit-user-role"
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                <option value="TEACHER">TEACHER</option>
                <option value="STUDENT">STUDENT</option>
                <option value="PARENT">PARENT</option>
                <option value="COMMUNITY_USER">COMMUNITY_USER</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={editingUser.isActive}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, isActive: e.target.checked })
                }
                className="accent-ocean-600"
              />
              <span className="font-medium text-ink">
                Cho phép tài khoản hoạt động
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-canvas text-ink font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Create User */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm Tài khoản Mới vào Hệ thống"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          {userActionError && (
            <div role="alert" className="p-2.5 rounded bg-status-danger-soft text-status-danger">
              {userActionError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="create-user-role" className="font-semibold text-ink block">
              Vai trò:
            </label>
            <select
              id="create-user-role"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
            >
              <option value="STUDENT">STUDENT (Học sinh — Đăng nhập bằng Mã HS)</option>
              <option value="TEACHER">TEACHER (Giáo viên)</option>
              <option value="PARENT">PARENT (Phụ huynh)</option>
              <option value="SCHOOL_ADMIN">SCHOOL_ADMIN (Quản trị trường)</option>
              <option value="COMMUNITY_USER">COMMUNITY_USER (Cộng đồng)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="create-user-fullname" className="font-semibold text-ink block">
              Họ và Tên:
            </label>
            <input
              id="create-user-fullname"
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder={newUserRole === "STUDENT" ? "VD: Nguyễn Minh Anh" : "VD: Cô Nguyễn Thị Hoa"}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
            />
          </div>

          {newUserRole === "STUDENT" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="create-student-code" className="font-semibold text-ink block">
                  Mã học sinh (Tên đăng nhập):
                </label>
                <input
                  id="create-student-code"
                  type="text"
                  required
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value.toUpperCase())}
                  placeholder="VD: HS2026-0705"
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-border font-mono text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="create-student-class" className="font-semibold text-ink block">
                  Lớp học:
                </label>
                <input
                  id="create-student-class"
                  type="text"
                  required
                  value={newStudentClass}
                  onChange={(e) => setNewStudentClass(e.target.value.toUpperCase())}
                  placeholder="VD: 7A1"
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-border font-mono text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="create-user-email" className="font-semibold text-ink block">
              {newUserRole === "STUDENT"
                ? "Email cá nhân (Không bắt buộc — Học sinh đăng nhập bằng Mã HS):"
                : "Email tài khoản:"}
            </label>
            <input
              id="create-user-email"
              type="email"
              required={newUserRole !== "STUDENT"}
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder={
                newUserRole === "STUDENT"
                  ? "Để trống nếu học sinh chưa có email trường"
                  : "Nhập email công vụ hoặc cá nhân"
              }
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-border text-ink focus:outline-none focus:ring-2 focus:ring-ocean-500/20 focus:border-ocean-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl bg-canvas text-ink font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold"
            >
              Tạo tài khoản & Cấp MK tạm
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: One-Time Temporary Password Display */}
      <Modal
        open={Boolean(oneTimeCredentials && oneTimeCredentials.length > 0)}
        onClose={() => {
          setOneTimeCredentials(null);
          setCopiedNotice(false);
        }}
        title={oneTimeTitle || "Thông tin Mật khẩu tạm một lần"}
        description="Mật khẩu tạm chỉ hiển thị một lần duy nhất sau khi khởi tạo hoặc đặt lại. Hệ thống chỉ lưu bản băm (scrypt) và buộc học sinh đổi mật khẩu ở lần đăng nhập đầu tiên."
        maxWidth="max-w-lg"
      >
        {oneTimeCredentials && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
              {oneTimeCredentials.map((cred) => (
                <div
                  key={cred.studentCode}
                  className="p-3 rounded-lg bg-white border border-amber-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-ink text-sm">
                      {cred.fullName}{" "}
                      <span className="text-xs font-semibold text-ocean-700">
                        ({cred.className})
                      </span>
                    </div>
                    <div className="text-ink-muted mt-0.5">
                      Tên đăng nhập (Mã HS):{" "}
                      <strong className="font-mono text-ink">
                        {cred.studentCode}
                      </strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">
                      Mật khẩu tạm (1 lần)
                    </span>
                    <span className="font-mono font-extrabold text-base text-amber-900 select-all">
                      {cred.temporaryPassword}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = oneTimeCredentials
                      .map(
                        (c) =>
                          `${c.fullName} (${c.className}) - Mã ĐN: ${c.studentCode} - MK tạm: ${c.temporaryPassword}`
                      )
                      .join("\n");
                    navigator.clipboard?.writeText(text);
                    setCopiedNotice(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-canvas hover:bg-surface-muted border border-border text-ink font-semibold inline-flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedNotice ? "Đã sao chép!" : "Sao chép"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadCredentialsCsv(oneTimeCredentials)}
                  className="px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất CSV</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOneTimeCredentials(null);
                  setCopiedNotice(false);
                }}
                className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-semibold"
              >
                Đã lưu & Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

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
  X,
} from "lucide-react";

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

  // Edit / Create User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("TEACHER");
  const [userActionError, setUserActionError] = useState<string | null>(null);

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
    setIsCommitting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/admin/import-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMMIT_IMPORT",
          rowsToCommit: previewData.validRows,
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
    setShowCreateModal(false);
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
              className="w-full pl-9 pr-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-brand-teal"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-canvas border border-border rounded-button text-xs text-ink focus:outline-none focus:border-brand-teal"
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
            className="px-3.5 py-2 rounded-button bg-canvas hover:bg-surface-muted border border-border text-ink text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-teal" />
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
            className="px-3.5 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-1.5"
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

                const isNoEmailPlaceholder = u.email.endsWith(
                  "@no-email.internal.unigo"
                );

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-canvas/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-ink">
                      {u.fullName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-mono font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-muted font-mono text-[11px]">
                      {isNoEmailPlaceholder ? (
                        <span className="italic text-ink-muted">
                          Chưa có email trong file gốc
                        </span>
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-ink">{info}</td>
                    <td className="py-3.5 px-4">
                      {u.accountStatus === "PENDING_ACTIVATION" ? (
                        <span className="text-[11px] font-semibold text-status-warning bg-status-warning-soft px-2 py-0.5 rounded">
                          Chờ kích hoạt OIDC
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
                      <button
                        type="button"
                        onClick={() => {
                          setUserActionError(null);
                          setEditingUser({ ...u });
                        }}
                        className="text-xs font-semibold text-brand-teal hover:underline inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Phân quyền</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nhập danh sách Học sinh UNIGO (Section IX) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-surface rounded-panel border border-border shadow-dialog p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-teal" />
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Nhập Danh sách Học sinh Năm học 2026 – 2027 (Khối 6, 7, 8)
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Tự động phân tích các sheet Khối 6, 7, 8 • Chuẩn hóa mã HS • Kiểm tra trùng lặp Idempotent • Không tự bịa email/điểm số
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded bg-status-danger-soft text-status-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importReport ? (
              <div
                data-testid="import-commit-report"
                className="p-5 rounded-panel bg-status-success-soft/50 border border-status-success/30 space-y-3 text-xs"
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
                      Cập nhật (Không trùng):
                    </span>
                    <span className="text-lg font-bold text-brand-teal">
                      {importReport.updatedIdempotentCount} học sinh
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
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-button bg-brand-teal text-white font-semibold"
                  >
                    Đóng báo cáo
                  </button>
                </div>
              </div>
            ) : !previewData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Load DANH SÁCH HỌC SINH NĂM HỌC 2026 - 2027.xlsx directly */}
                  <div className="p-5 rounded-panel bg-canvas border border-border flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-brand-teal uppercase">
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
                      className="w-full py-2.5 px-4 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors"
                    >
                      {isLoadingPreview
                        ? "Đang phân tích cấu trúc sheet..."
                        : "Phân tích & Xem trước file Năm học 2026 - 2027"}
                    </button>
                  </div>

                  {/* Option 2: Upload custom .xlsx or .csv */}
                  <label className="p-5 rounded-panel bg-canvas border-2 border-dashed border-brand-teal/40 hover:bg-surface-muted transition-colors cursor-pointer flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-brand-teal uppercase">
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
                    className="font-semibold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải DANH SÁCH HỌC SINH NĂM HỌC 2026 - 2027.xlsx</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Summary Banner */}
                <div className="p-3.5 rounded-panel bg-brand-teal-soft/50 border border-brand-teal/30 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-ink">
                      File: {previewData.fileName}
                    </span>
                    <span className="text-ink-muted ml-2">
                      (Sheets: {previewData.sheetsDetected.join(", ")})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-brand-teal">
                    <span>Khối 6: {previewData.gradeBreakdown.grade6} HS</span>
                    <span>•</span>
                    <span>Khối 7: {previewData.gradeBreakdown.grade7} HS</span>
                    <span>•</span>
                    <span>Khối 8: {previewData.gradeBreakdown.grade8} HS</span>
                  </div>
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
                            <td className="py-2 px-3 font-bold text-brand-teal">
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
                                <span className="text-[10px] font-semibold bg-canvas border border-border text-ink-muted px-2 py-0.5 rounded">
                                  Đã có (Cập nhật Idempotent)
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold bg-status-success-soft text-status-success px-2 py-0.5 rounded">
                                  Mới hoàn toàn
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewData(null)}
                    className="px-4 py-2 rounded-button bg-canvas hover:bg-surface-muted font-semibold text-ink"
                  >
                    Chọn file khác
                  </button>
                  <button
                    type="button"
                    data-testid="commit-excel-import-btn"
                    onClick={handleCommitImport}
                    disabled={isCommitting}
                    className="px-5 py-2 rounded-button bg-brand-teal text-white font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm"
                  >
                    {isCommitting
                      ? "Đang lưu vào CSDL..."
                      : `Xác nhận Import (${previewData.validRows.length} học sinh)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Edit User Role & Status */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <form
            onSubmit={handleSaveUserEdit}
            className="w-full max-w-md bg-surface rounded-panel border border-border shadow-dialog p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-ink">
                Phân quyền & Cập nhật Tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userActionError && (
              <div className="p-2.5 rounded bg-status-danger-soft text-status-danger">
                {userActionError}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-ink block">Họ và Tên:</label>
              <input
                type="text"
                value={editingUser.fullName}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, fullName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">
                Vai trò Hệ thống (RBAC):
              </label>
              <select
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
                className="accent-brand-teal"
              />
              <span className="font-medium text-ink">
                Cho phép tài khoản hoạt động
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-button bg-canvas text-ink font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-button bg-brand-teal text-white font-semibold"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <form
            onSubmit={handleCreateUser}
            className="w-full max-w-md bg-surface rounded-panel border border-border shadow-dialog p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-ink">
                Thêm Tài khoản Mới vào Hệ thống
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userActionError && (
              <div className="p-2.5 rounded bg-status-danger-soft text-status-danger">
                {userActionError}
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-ink block">Họ và Tên:</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="VD: Cô Nguyễn Thị Hoa"
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">Email:</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="hoa.nguyen@unigo.edu.vn"
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-ink block">Vai trò:</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              >
                <option value="TEACHER">TEACHER (Giáo viên)</option>
                <option value="STUDENT">STUDENT (Học sinh)</option>
                <option value="PARENT">PARENT (Phụ huynh)</option>
                <option value="SCHOOL_ADMIN">SCHOOL_ADMIN (Quản trị trường)</option>
                <option value="COMMUNITY_USER">COMMUNITY_USER (Cộng đồng)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-button bg-canvas text-ink font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-button bg-brand-teal text-white font-semibold"
              >
                Tạo tài khoản
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

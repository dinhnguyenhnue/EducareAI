"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Calendar,
  CheckCircle2,
  Network,
  X,
  RefreshCw,
} from "lucide-react";

export function TeacherAssignmentsClient({
  initialAssignments,
  classes,
  subjects,
}: {
  initialAssignments: any[];
  classes: any[];
  subjects: any[];
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [syncClassroom, setSyncClassroom] = useState(true);
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          instructions,
          classId,
          subjectId,
          syncClassroom,
          syncCalendar,
        }),
      });
      const data = await res.json();
      if (res.ok && data.assignment) {
        setAssignments((prev) => [data.assignment, ...prev]);
        setShowModal(false);
        setTitle("");
        setDescription("");
        setInstructions("");
        setBannerMsg(
          `Đã tạo bài tập "${data.assignment.title}" và đồng bộ ngữ cảnh Google Classroom / Calendar thành công.`
        );
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSyncClassroom = async (assignmentId: string) => {
    setSyncingId(assignmentId);
    setBannerMsg(null);
    try {
      const res = await fetch("/api/google/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SYNC_CLASSROOM",
          payload: { assignmentId },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBannerMsg(data.message);
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  syncStatus: "SYNCED",
                  classroomCourseworkId: data.data?.courseworkId,
                }
              : a
          )
        );
      }
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">
              Quản lý Bài tập & Nhiệm vụ thực hành
            </h1>
            <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
              Assessment & Google Classroom Sync
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Giao bài tập theo lớp, cấu hình rubric 4 tiêu chí và đồng bộ trực tiếp sang Google Classroom / Google Calendar ngay trong quy trình giao bài.
          </p>
        </div>

        <button
          type="button"
          data-testid="create-assignment-btn"
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo bài tập mới</span>
        </button>
      </div>

      {bannerMsg && (
        <div className="p-3.5 rounded-panel bg-status-success-soft border border-status-success/30 text-xs text-status-success font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            className="text-xs underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((a) => {
          const gradedCount = (a.submissions || []).filter(
            (s: any) => s.status === "GRADED"
          ).length;
          const submittedCount = (a.submissions || []).length;

          return (
            <div
              key={a.id}
              className="p-6 rounded-panel bg-surface border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-teal/40 transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold bg-brand-teal-soft text-brand-teal px-2 py-0.5 rounded">
                    {a.subject?.name}
                  </span>
                  <span className="text-xs font-bold text-ink">
                    Lớp {a.schoolClass?.name}
                  </span>
                  <span className="text-xs text-ink-muted">•</span>
                  <span className="text-xs text-ink-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Hạn nộp: {new Date(a.dueAt).toLocaleDateString("vi-VN")}
                  </span>
                  {a.syncStatus === "SYNCED" && (
                    <span className="text-[11px] font-semibold text-status-success bg-status-success-soft px-2 py-0.5 rounded">
                      Đã đồng bộ Classroom (
                      {a.classroomCourseworkId || "STUDENT_COPY"})
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-ink">{a.title}</h3>
                <p className="text-xs text-ink-muted line-clamp-2 max-w-3xl leading-relaxed">
                  {a.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="text-right text-xs mr-2">
                  <div className="font-mono font-bold text-ink text-sm">
                    {gradedCount}/{submittedCount}{" "}
                    <span className="text-[11px] font-normal text-ink-muted">
                      đã chấm
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted block mt-0.5">
                    {submittedCount} bài nộp
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncClassroom(a.id)}
                  disabled={syncingId === a.id}
                  className="px-3 py-2 rounded-button bg-canvas hover:bg-surface-muted border border-border text-ink text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-brand-teal ${
                      syncingId === a.id ? "animate-spin" : ""
                    }`}
                  />
                  <span>Đồng bộ Classroom</span>
                </button>

                <Link
                  href="/giao-vien/cham-bai"
                  className="px-4 py-2 rounded-button bg-brand-teal text-white text-xs font-semibold hover:bg-brand-teal-hover transition-colors shadow-sm"
                >
                  Vào chấm điểm →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <form
            onSubmit={handleCreateAssignment}
            className="w-full max-w-lg bg-surface rounded-panel border border-border shadow-dialog p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-ink">
                Giao Bài tập mới & Tích hợp Google Workspace
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-ink block mb-1">
                  Lớp học:
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Lớp {c.name} (Khối {c.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-ink block mb-1">
                  Môn học:
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Tiêu đề bài tập / Dự án:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Thiết kế bảng thống kê dữ liệu trên Google Sheets"
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            <div>
              <label className="font-semibold text-ink block mb-1">
                Mô tả nhiệm vụ & Yêu cầu cần đạt:
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả mục tiêu sản phẩm, cách thức tự nghiên cứu và tiêu chí tự đánh giá..."
                className="w-full px-3 py-2 rounded-button bg-canvas border border-border text-ink"
              />
            </div>

            {/* Contextual Google Workspace Options (Section X) */}
            <div className="p-3.5 rounded-panel bg-brand-teal-soft/40 border border-brand-teal/30 space-y-2">
              <div className="font-bold text-brand-teal flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                <span>Tích hợp Google Workspace theo ngữ cảnh:</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncClassroom}
                  onChange={(e) => setSyncClassroom(e.target.checked)}
                  className="accent-brand-teal"
                />
                <span>
                  Đồng bộ sang <strong>Google Classroom</strong> (Chế độ{" "}
                  <code>STUDENT_COPY</code>)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncCalendar}
                  onChange={(e) => setSyncCalendar(e.target.checked)}
                  className="accent-brand-teal"
                />
                <span>
                  Tạo sự kiện hạn nộp và nhắc việc trên{" "}
                  <strong>Google Calendar</strong> của lớp
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-button bg-canvas text-ink font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-5 py-2 rounded-button bg-brand-teal text-white font-semibold"
              >
                {isCreating ? "Đang tạo & đồng bộ..." : "Giao bài tập ngay"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


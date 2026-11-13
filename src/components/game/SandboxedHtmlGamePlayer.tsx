"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  wrapHtmlWithStrictCsp,
  analyzeStudentHtmlCode,
  type StaticScanResult,
} from "@/lib/html-game-sandbox";
import {
  ShieldCheck,
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface SandboxedHtmlGamePlayerProps {
  title: string;
  htmlSourceCode: string;
  slug?: string;
  versionNumber?: number;
  authorName?: string;
  className?: string;
  showSecurityInspector?: boolean;
  height?: number;
}

interface UnverifiedPracticeEvent {
  gameType: string;
  score: number;
  maxScore: number;
  receivedAt: string;
}

export default function SandboxedHtmlGamePlayer({
  title,
  htmlSourceCode,
  slug,
  versionNumber = 1,
  authorName,
  className = "7A1",
  showSecurityInspector = false,
  height = 540,
}: SandboxedHtmlGamePlayerProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [practiceEvent, setPracticeEvent] =
    useState<UnverifiedPracticeEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const safeSrcDoc = useMemo(
    () => wrapHtmlWithStrictCsp(htmlSourceCode || ""),
    [htmlSourceCode]
  );

  const scanReport: StaticScanResult = useMemo(
    () => analyzeStudentHtmlCode(htmlSourceCode || ""),
    [htmlSourceCode]
  );

  // Listen to optional postMessage practice completion from inside the isolated iframe.
  // Section 6 rule: Any score sent from inside an HTML game is strictly tagged as UNVERIFIED PRACTICE ONLY.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") return;
      if (
        event.data.type === "TIN_HOC_GAME_PRACTICE_COMPLETE" ||
        event.data.type === "TINHOC_GAME_PRACTICE_RESULT"
      ) {
        const rawScore = Number(event.data.score);
        const rawMax = Number(event.data.maxScore || 10);
        if (!Number.isFinite(rawScore) || !Number.isFinite(rawMax) || rawMax <= 0) {
          return;
        }
        const safeMax = Math.min(1000, Math.max(1, rawMax));
        const safeScore = Math.min(safeMax, Math.max(0, rawScore));
        setPracticeEvent({
          gameType: String(event.data.gameType || "HTML_GAME").slice(0, 40),
          score: safeScore,
          maxScore: safeMax,
          receivedAt: new Date().toLocaleTimeString("vi-VN"),
        });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen((prev) => !prev);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
    >
      {/* Top Sandbox Security Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 text-slate-100 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-950/90 text-sky-300 border border-sky-700/60">
            <Lock className="w-3.5 h-3.5" />
            Sandbox Cô Lập (sandbox=&quot;allow-scripts&quot;)
          </span>
          <span className="text-sm font-semibold truncate">{title}</span>
          <span className="text-xs text-slate-400">
            v{versionNumber} {authorName ? `• ${authorName} (${className})` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPracticeEvent(null);
              setReloadKey((k) => k + 1);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Khởi động lại trò chơi trong khung cô lập"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Chơi lại
          </button>

          {slug && (
            <a
              href={`/embed/tro-choi/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 transition-colors"
              title="Mở trang chơi độc lập (Dùng khi nhúng Google Sites hoặc màn hình nhỏ)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở tab cách ly
            </a>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-ocean-600 hover:bg-ocean-700 text-white transition-colors"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Thu nhỏ
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                Toàn màn hình
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unverified Practice Score Banner (Section 6 rule: Never treated as official exam score) */}
      {practiceEvent && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Kết quả tự luyện trong trò chơi:</strong> Đạt{" "}
              <strong>
                {practiceEvent.score}/{practiceEvent.maxScore}
              </strong>{" "}
              (Ghi nhận lúc {practiceEvent.receivedAt}).
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 font-medium text-amber-800">
            Trạng thái: Chưa xác minh (Chỉ dùng tự luyện, không tính điểm kiểm tra chính thức)
          </span>
        </div>
      )}

      {/* Teacher Static Scan Inspector (Only shown when showSecurityInspector=true) */}
      {showSecurityInspector && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-semibold">Kiểm tra tĩnh & Thực thi cô lập:</span>
              <span>
                Kích thước: {(scanReport.fileSizeBytes / 1024).toFixed(1)} KB / 256 KB
              </span>
              <span>•</span>
              <span
                className={`font-semibold ${
                  scanReport.riskLevel === "LOW"
                    ? "text-emerald-700"
                    : scanReport.riskLevel === "MEDIUM"
                    ? "text-amber-700"
                    : "text-rose-700"
                }`}
              >
                Mức cảnh báo tĩnh: {scanReport.riskLevel}
              </span>
            </div>
            <span className="text-slate-500">
              Không có allow-same-origin • CSP connect-src &apos;none&apos;
            </span>
          </div>

          {scanReport.findings.length > 0 && (
            <div className="mt-2 space-y-1">
              {scanReport.findings.map((f, i) => (
                <div
                  key={`${f.code}-${i}`}
                  className="flex items-center gap-1.5 text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded border border-amber-200"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>[{f.code}]</strong> {f.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MANDATORY ISOLATED SANDBOX IFRAME:
          - ONLY sandbox="allow-scripts"
          - NO allow-same-origin (opaque origin: cannot read parent DOM, cookies, or localStorage)
          - NO allow-top-navigation (cannot redirect parent window)
          - NO allow-popups, NO allow-forms
      */}
      <div className="relative w-full bg-slate-950 flex-1">
        <iframe
          key={reloadKey}
          title={`Khung cô lập trò chơi: ${title}`}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          srcDoc={safeSrcDoc}
          style={{
            width: "100%",
            height: isFullscreen ? "calc(100vh - 52px)" : `${height}px`,
            border: "none",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}


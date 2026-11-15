export interface NormalizedHtmlGamePlay {
  score10: number;
  rawScore: number;
  maxScore: number;
  accuracyRate: number;
  timeSpentSeconds: number;
  wrongTopics: string[];
  eventType: string;
  idempotencyKey: string | null;
}

export function normalizeHtmlGamePlayPayload(raw: Record<string, unknown>): NormalizedHtmlGamePlay {
  const rawMax = Number(raw.maxScore);
  const maxScore = Number.isFinite(rawMax) && rawMax > 0 ? Math.min(10000, rawMax) : 10;

  const rawScoreInput = Number(raw.score ?? 0);
  const rawScore = Number.isFinite(rawScoreInput)
    ? Math.max(0, Math.min(maxScore, rawScoreInput))
    : 0;

  const score10 =
    maxScore === 10
      ? Math.round(rawScore * 100) / 100
      : Math.round(((rawScore / maxScore) * 10) * 100) / 100;

  const accuracyRate = Math.round(((rawScore / maxScore) * 100) * 100) / 100;

  const rawDuration = Number(raw.timeSpentSeconds ?? 0);
  const timeSpentSeconds =
    Number.isFinite(rawDuration) && rawDuration >= 0
      ? Math.min(86400, Math.round(rawDuration))
      : 0;

  const wrongTopics = Array.isArray(raw.wrongTopics)
    ? raw.wrongTopics
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0)
        .slice(0, 30)
    : [];

  const eventType =
    typeof raw.eventType === "string" && raw.eventType.trim()
      ? raw.eventType.trim().slice(0, 64)
      : "PRACTICE_COMPLETE";

  const idempotencyKey =
    typeof raw.idempotencyKey === "string" && raw.idempotencyKey.trim()
      ? raw.idempotencyKey.trim().slice(0, 128)
      : null;

  return {
    score10,
    rawScore,
    maxScore,
    accuracyRate,
    timeSpentSeconds,
    wrongTopics,
    eventType,
    idempotencyKey,
  };
}

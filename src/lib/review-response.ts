/** Read only completed model output, never tool/thought steps. */
export function readReviewResponse(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const value = data as { status?: string; steps?: { type?: string; content?: { type?: string; text?: unknown }[] }[] };
  if (value.status !== "completed" || !Array.isArray(value.steps)) return "";
  return value.steps.filter(s => s.type === "model_output" && Array.isArray(s.content))
    .flatMap(s => s.content || []).filter(c => c.type === "text" && typeof c.text === "string")
    .map(c => c.text as string).join("\n");
}

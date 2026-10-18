import type { ParticipantSlot, RepEvent } from "../types/kneeCounter.types";

export function countCurrentGroupPass(slots: ParticipantSlot[]) {
  return slots.filter((slot) => slot.leftEvaluation === "PASS" || slot.rightEvaluation === "PASS").length;
}

export function isSynchronizedGroup(
  events: RepEvent[],
  participantIds: string[],
  nowMs: number,
  windowMs: number,
  leg: "left" | "right",
) {
  const recent = events.filter((event) => event.leg === leg && nowMs - event.detectedAtMs <= windowMs);
  return participantIds.length > 0 && participantIds.every((id) => recent.some((event) => event.participantId === id));
}

export function exportRepEventsCsv(events: RepEvent[]) {
  const header = "sessionStartedAt,detectedAtMs,participantId,trackId,leg,ratio,thresholdPercent,backend,profile,result";
  const rows = events.map((event) => [event.sessionStartedAt, event.detectedAtMs, event.participantId, event.trackId ?? "", event.leg, event.ratio ?? "", event.thresholdPercent, event.backend ?? "", event.profile, event.result].map(csvCell).join(","));
  return [header, ...rows].join("\n");
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

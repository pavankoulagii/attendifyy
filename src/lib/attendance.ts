// Attendance math — pure functions, fully tested formulas

export type Status = "present" | "absent" | "cancelled";

export interface SubjectStats {
  attended: number;
  held: number;
  required: number; // percentage e.g. 75
}

// Attendance % — 0 when no classes have been held yet (fresh start),
// so a brand-new student doesn't see a misleading "100%".
export const percent = (attended: number, held: number) =>
  held === 0 ? 0 : (attended / held) * 100;

/**
 * Maximum consecutive classes the student can SKIP starting now
 * while keeping (attended) / (held + skips) * 100 >= required.
 */
export function safeBunks({ attended, held, required }: SubjectStats): number {
  const r = required / 100;
  if (r <= 0) return Infinity;
  // attended / (held + x) >= r  =>  x <= attended/r - held
  const x = Math.floor(attended / r - held);
  return Math.max(0, x);
}

/**
 * Minimum consecutive classes the student must ATTEND from now
 * to reach required %, assuming none missed.
 * (attended + x) / (held + x) >= r  =>  x >= (r*held - attended)/(1 - r)
 */
export function classesToRecover({ attended, held, required }: SubjectStats): number {
  const r = required / 100;
  if (r >= 1) return Infinity;
  const cur = percent(attended, held);
  if (cur >= required) return 0;
  const x = Math.ceil((r * held - attended) / (1 - r));
  return Math.max(0, x);
}

export function nextMissPercent({ attended, held }: SubjectStats): number {
  return percent(attended, held + 1);
}

export type HealthStatus = "safe" | "warning" | "critical";
export function healthStatus(p: number, required: number): HealthStatus {
  if (p >= required + 5) return "safe";
  if (p >= required) return "warning";
  return "critical";
}

export const healthColor: Record<HealthStatus, string> = {
  safe: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  critical: "hsl(var(--destructive))",
};

export const healthLabel: Record<HealthStatus, string> = {
  safe: "Safe",
  warning: "Warning",
  critical: "Critical",
};

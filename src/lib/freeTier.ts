// Free-tier limit: only the first N subjects (by creation order) are
// counted toward overall % and are interactive. Premium unlocks all.
import type { Subject } from "@/lib/data";

export const FREE_SUBJECT_LIMIT = 3;

export function isPremium(profile: any): boolean {
  return !!profile?.is_premium;
}

/**
 * Subjects accessible/counted on the free tier (or all if premium).
 *
 * Stability contract: ordering uses `created_at ASC`, which is set ONCE at
 * row insert and is never modified by timetable re-uploads or edits
 * (`useImportTimetable` merges by name and only patches schedule/faculty —
 * see src/lib/periods.ts). This guarantees the same first 3 subjects stay
 * unlocked even after the user re-uploads or tweaks their timetable.
 */
export function accessibleSubjects(subjects: Subject[], profile: any): Subject[] {
  if (isPremium(profile)) return subjects;
  const sorted = [...subjects].sort((a, b) =>
    (a.created_at ?? "").localeCompare(b.created_at ?? "")
  );
  return sorted.slice(0, FREE_SUBJECT_LIMIT);
}

/** Subjects locked behind Pro on free tier. */
export function lockedSubjects(subjects: Subject[], profile: any): Subject[] {
  if (isPremium(profile)) return [];
  const sorted = [...subjects].sort((a, b) =>
    (a.created_at ?? "").localeCompare(b.created_at ?? "")
  );
  return sorted.slice(FREE_SUBJECT_LIMIT);
}

export function isSubjectLocked(subject: Subject, subjects: Subject[], profile: any): boolean {
  if (isPremium(profile)) return false;
  return lockedSubjects(subjects, profile).some((s) => s.id === subject.id);
}

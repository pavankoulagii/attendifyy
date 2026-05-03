import { Link } from "react-router-dom";
import { useProfile, useSubjects } from "@/lib/data";
import { FREE_SUBJECT_LIMIT, isPremium, lockedSubjects } from "@/lib/freeTier";

/**
 * Info banner shown to free users explaining that overall % is computed
 * only from their first {FREE_SUBJECT_LIMIT} subjects (by creation order).
 * Hidden for premium users or users with <= FREE_SUBJECT_LIMIT subjects.
 */
export default function FreeTierBanner() {
  const { data: profile } = useProfile();
  const { data: subjects = [] } = useSubjects();

  if (isPremium(profile)) return null;
  const locked = lockedSubjects(subjects, profile);
  if (locked.length === 0) return null;

  return (
    <div
      role="note"
      className="surface-low border border-primary/20 rounded-xl p-4 flex items-start gap-3"
      title={`Overall % uses only your first ${FREE_SUBJECT_LIMIT} subjects on the free plan.`}
    >
      <span
        className="material-symbols-outlined text-primary shrink-0"
        style={{ fontSize: 20 }}
        aria-hidden
      >
        info
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground leading-snug">
          Overall % counts only your first {FREE_SUBJECT_LIMIT} subjects
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {locked.length} subject{locked.length === 1 ? " is" : "s are"} locked on the free plan and not included in your overall attendance.{" "}
          <Link to="/app/premium" className="text-primary font-bold underline-offset-2 hover:underline">
            Unlock all with Pro
          </Link>
        </p>
      </div>
    </div>
  );
}

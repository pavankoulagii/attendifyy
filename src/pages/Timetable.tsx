import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMarkAttendance, useSubjects, useProfile, type Subject } from "@/lib/data";
import { useClassPeriods, useClearTimetable, TIMETABLE_TTL_MS, fmtTime } from "@/lib/periods";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { percent, healthStatus } from "@/lib/attendance";
import { Button } from "@/components/ui/button";

const DAYS = [
  { short: "S", long: "Sun" },
  { short: "M", long: "Mon" },
  { short: "T", long: "Tue" },
  { short: "W", long: "Wed" },
  { short: "T", long: "Thu" },
  { short: "F", long: "Fri" },
  { short: "S", long: "Sat" },
];

export default function Timetable() {
  const nav = useNavigate();
  const { data: subjects = [] } = useSubjects();
  const { data: periods = [] } = useClassPeriods();
  const { data: profile } = useProfile();
  const { mutate: clearTimetable, isPending: isClearingTimetable } = useClearTimetable();
  const [day, setDay] = useState<number>(new Date().getDay());
  const mark = useMarkAttendance();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickReplacement = (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image too large (max 8MB)");
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("queuedTimetableImage", reader.result as string);
      nav("/app/subjects/new?replace=1");
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => fileRef.current?.click();

  // Weekly expiry: timetable auto-clears after 7 days from upload
  const timetableUploadedAt = (profile as { timetable_uploaded_at?: string | null } | null)?.timetable_uploaded_at;
  const uploadedAt = timetableUploadedAt
    ? new Date(timetableUploadedAt).getTime()
    : null;
  const legacyStartedAt = subjects.length > 0
    ? Math.min(...subjects.map((s) => new Date(s.created_at).getTime()).filter(Number.isFinite))
    : null;
  const timetableStartedAt = uploadedAt ?? legacyStartedAt;
  const hasAnySchedule = periods.length > 0 || subjects.length > 0;
  const isExpired = !!timetableStartedAt && Date.now() - timetableStartedAt > TIMETABLE_TTL_MS;
  const visiblePeriods = isExpired ? [] : periods;
  const visibleSubjects = isExpired ? [] : subjects;
  const daysLeft = timetableStartedAt
    ? Math.max(0, Math.ceil((timetableStartedAt + TIMETABLE_TTL_MS - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  useEffect(() => {
    if (isExpired && hasAnySchedule && !isClearingTimetable) {
      clearTimetable(undefined, {
        onSuccess: () => toast.info("Your weekly timetable expired. Please upload a new one."),
      });
    }
  }, [clearTimetable, hasAnySchedule, isClearingTimetable, isExpired]);

  const subjectsById = new Map(visibleSubjects.map((s) => [s.id, s]));

  // Periods scheduled for selected day, sorted by start_time
  const todayPeriods = visiblePeriods
    .filter((p) => p.day_of_week === day)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Fallback for subjects without periods (legacy weekly_schedule)
  const fallback = visibleSubjects.filter(
    (s) =>
      Array.isArray(s.weekly_schedule) &&
      (s.weekly_schedule as number[]).includes(day) &&
      !visiblePeriods.some((p) => p.subject_id === s.id),
  );

  const isEmpty = todayPeriods.length === 0 && fallback.length === 0;

  // Expired + nothing left to show → dedicated upload prompt
  if (isExpired) {
    return (
      <main className="px-5 pt-6 pb-8 space-y-6 animate-fade-in">
        <header>
          <h1 className="font-headline font-extrabold text-3xl tracking-tight">Timetable</h1>
        </header>
        <div className="bg-card rounded-3xl p-8 shadow-card text-center space-y-4">
          <div className="inline-grid h-16 w-16 rounded-2xl gradient-primary shadow-glow place-items-center mx-auto">
            <span className="material-symbols-outlined ms-fill text-white" style={{ fontSize: 32 }}>event_repeat</span>
          </div>
          <div className="space-y-1">
            <p className="font-headline font-extrabold text-xl">This week's timetable expired</p>
            <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
              Timetables refresh every 7 days. Upload your timetable for the new week to continue tracking.
            </p>
          </div>
          <Button
            onClick={triggerUpload}
            className="w-full h-14 rounded-2xl gradient-primary border-0 shadow-glow font-headline font-bold tap-scale flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined ms-fill" style={{ fontSize: 22 }}>add_a_photo</span>
            Upload new timetable
          </Button>
          <button
            onClick={() => nav("/app/subjects/new?replace=1")}
            className="text-xs font-headline font-bold text-muted-foreground underline tap-scale"
          >
            Or enter manually
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPickReplacement(e.target.files[0])}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pt-6 pb-8 space-y-6 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-headline font-extrabold text-3xl tracking-tight">Timetable</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            {todayPeriods.length > 0
              ? `${todayPeriods.length} class${todayPeriods.length === 1 ? "" : "es"} today`
              : "Tap a class to mark attendance"}
          </p>
        </div>
        <button
          onClick={triggerUpload}
          className="h-11 px-4 rounded-2xl gradient-primary text-white shadow-glow tap-scale flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_a_photo</span>
          <span className="text-xs font-headline font-bold">Replace</span>
        </button>
      </header>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPickReplacement(e.target.files[0])}
      />

      {timetableStartedAt && hasAnySchedule && !isExpired && (
        <div className={cn(
          "rounded-2xl px-4 py-3 flex items-center gap-3 shadow-soft",
          daysLeft <= 2 ? "bg-destructive-container text-destructive-container-foreground" : "surface-low"
        )}>
          <span className="material-symbols-outlined ms-fill" style={{ fontSize: 20 }}>event_repeat</span>
          <p className="text-xs font-headline font-bold flex-1">
            {daysLeft === 0
              ? "Expires today — upload a new timetable"
              : `Weekly timetable · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
          </p>
          {daysLeft <= 2 && (
            <button
              onClick={triggerUpload}
              className="text-[11px] font-headline font-bold underline tap-scale"
            >
              Renew
            </button>
          )}
        </div>
      )}

      <section className="grid grid-cols-7 gap-2">
        {DAYS.map((d, i) => {
          const active = day === i;
          return (
            <button
              key={i}
              onClick={() => setDay(i)}
              className={cn(
                "py-3 rounded-2xl flex flex-col items-center gap-0.5 tap-scale transition-all",
                active
                  ? "gradient-primary text-white shadow-glow"
                  : "surface-low text-muted-foreground hover:bg-surface-mid",
              )}
            >
              <span className="font-headline font-bold text-sm">{d.short}</span>
              <span className="text-[9px] font-bold opacity-80">{d.long.slice(1)}</span>
            </button>
          );
        })}
      </section>

      {isEmpty ? (
        <div className="bg-card rounded-xl p-10 text-center shadow-card">
          <div className="text-5xl mb-2">🎉</div>
          <p className="font-headline font-bold text-lg">No classes</p>
          <p className="text-sm text-muted-foreground font-medium">Enjoy your day off!</p>
        </div>
      ) : (
        <section className="space-y-3">
          {todayPeriods.map((p) => {
            const subject = subjectsById.get(p.subject_id);
            if (!subject) return null;
            const subjectIdx = visibleSubjects.findIndex((s) => s.id === subject.id);
            const locked = !profile?.is_premium && subjectIdx >= 2;
            return (
              <PeriodCard
                key={p.id}
                subject={subject}
                start={p.start_time}
                end={p.end_time}
                room={p.room}
                locked={locked}
                onMark={(st) => {
                  if (locked) {
                    toast.error("Free plan: only 2 subjects. Upgrade to Pro to unlock all.");
                    nav("/app/premium");
                    return;
                  }
                  mark.mutate({ subject, status: st });
                  toast.success(`${subject.name}: ${st}`);
                }}
              />
            );
          })}

          {fallback.map((s) => {
            const subjectIdx = visibleSubjects.findIndex((x) => x.id === s.id);
            const locked = !profile?.is_premium && subjectIdx >= 2;
            return (
              <PeriodCard
                key={s.id}
                subject={s}
                start={null}
                end={null}
                room={null}
                locked={locked}
                onMark={(st) => {
                  if (locked) {
                    toast.error("Free plan: only 2 subjects. Upgrade to Pro to unlock all.");
                    nav("/app/premium");
                    return;
                  }
                  mark.mutate({ subject: s, status: st });
                  toast.success(`${s.name}: ${st}`);
                }}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}

function PeriodCard({
  subject, start, end, room, onMark, locked = false,
}: {
  subject: Subject;
  start: string | null;
  end: string | null;
  room: string | null;
  onMark: (s: "present" | "absent" | "cancelled") => void;
  locked?: boolean;
}) {
  const p = percent(subject.classes_attended, subject.classes_held);
  const st = healthStatus(p, Number(subject.required_attendance));

  return (
    <div className={cn("bg-card rounded-2xl p-5 shadow-card space-y-4 relative", locked && "opacity-60")}>
      {locked && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
          PRO
        </div>
      )}
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-2xl grid place-items-center text-white shrink-0 shadow-soft"
          style={{ background: subject.color }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu_book</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-base truncate">{subject.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium truncate">
            {start && end ? (
              <span className="truncate">{fmtTime(start)} – {fmtTime(end)}</span>
            ) : (
              <span className="truncate">{subject.faculty || "—"}</span>
            )}
            {room && <span className="text-[10px] surface-low px-1.5 py-0.5 rounded">{room}</span>}
          </div>
        </div>
        <span
          className={cn(
            "text-sm font-headline font-black shrink-0",
            st === "safe" && "text-secondary",
            st === "warning" && "text-warning",
            st === "critical" && "text-destructive",
          )}
        >
          {Math.round(p)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <ActionBtn icon="check_circle" label="Present" tone="success" onClick={() => onMark("present")} />
        <ActionBtn icon="cancel" label="Absent" tone="danger" onClick={() => onMark("absent")} />
        <ActionBtn icon="event_busy" label="Cancel" tone="muted" onClick={() => onMark("cancelled")} />
      </div>
    </div>
  );
}

function ActionBtn({
  icon, label, tone, onClick,
}: {
  icon: string; label: string; tone: "success" | "danger" | "muted"; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl py-3 flex flex-col items-center gap-1 tap-scale transition-all",
        tone === "success" && "gradient-primary text-white shadow-glow",
        tone === "danger" && "bg-destructive-container text-destructive-container-foreground",
        tone === "muted" && "surface-low text-foreground hover:bg-surface-mid",
      )}
    >
      <span className="material-symbols-outlined ms-fill" style={{ fontSize: 22 }}>{icon}</span>
      <span className="text-[11px] font-headline font-bold">{label}</span>
    </button>
  );
}

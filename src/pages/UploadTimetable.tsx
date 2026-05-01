import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useImportTimetable, type ExtractedSubject, fmtTime } from "@/lib/periods";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Stage = "upload" | "extracting" | "review";

export default function UploadTimetable() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const replaceMode = params.get("replace") === "1";
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedSubject[]>([]);
  const [validityDays, setValidityDays] = useState<number>(7);
  const importMut = useImportTimetable();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image too large (max 8MB)");

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setStage("extracting");

      try {
        const base64 = dataUrl.split(",")[1];
        const { data, error } = await supabase.functions.invoke("extract-timetable", {
          body: { imageBase64: base64, mimeType: file.type },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const subjects: ExtractedSubject[] = data.subjects || [];
        const vDays: number = Number(data.validity_days) || 7;
        if (subjects.length === 0) {
          toast.error("Couldn't detect any subjects. Try a clearer image.");
          setStage("upload");
          return;
        }
        setExtracted(subjects);
        setValidityDays(vDays);
        setStage("review");
        const label = vDays >= 300 ? "yearly" : vDays >= 150 ? "6-month" : vDays >= 90 ? "semester" : "weekly";
        toast.success(`Found ${subjects.length} subject${subjects.length === 1 ? "" : "s"} · ${label} timetable 🎉`);
      } catch (err: any) {
        toast.error(err.message || "Extraction failed");
        setStage("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSubject = (i: number, patch: Partial<ExtractedSubject>) => {
    setExtracted((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const removeSubject = (i: number) => setExtracted((prev) => prev.filter((_, idx) => idx !== i));

  const removePeriod = (si: number, pi: number) =>
    setExtracted((prev) =>
      prev.map((s, i) =>
        i === si ? { ...s, periods: s.periods.filter((_, idx) => idx !== pi) } : s,
      ),
    );

  const save = async () => {
    const valid = extracted.filter((s) => s.name.trim() && s.periods.length > 0);
    if (valid.length === 0) return toast.error("Nothing to save");
    try {
      await importMut.mutateAsync({ subjects: valid, replace: replaceMode, validityDays });
      toast.success(replaceMode ? `New week imported · ${valid.length} subjects` : `Imported ${valid.length} subjects`);
      nav("/app/timetable");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    }
  };

  // Auto-trigger flow: an image was queued from the Timetable "Upload new" tap
  useEffect(() => {
    const queued = sessionStorage.getItem("queuedTimetableImage");
    if (!queued) return;
    sessionStorage.removeItem("queuedTimetableImage");
    fetch(queued)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], "timetable.jpg", { type: blob.type || "image/jpeg" });
        handleFile(file);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="px-5 pt-6 pb-32 animate-fade-in">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => nav(-1)} className="h-10 w-10 rounded-2xl surface-low grid place-items-center tap-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-headline font-extrabold text-2xl tracking-tight">Scan timetable</h1>
          <p className="text-xs text-muted-foreground font-medium">AI reads your timetable image</p>
        </div>
      </header>

      {stage === "upload" && (
        <div className="space-y-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full surface-low rounded-3xl p-10 flex flex-col items-center gap-3 border-2 border-dashed border-primary/30 tap-scale"
          >
            <div className="h-16 w-16 rounded-2xl gradient-primary grid place-items-center shadow-glow">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 32 }}>add_a_photo</span>
            </div>
            <div className="text-center">
              <p className="font-headline font-bold text-lg">Upload timetable image</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">JPG, PNG · up to 8MB</p>
            </div>
          </button>

          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <div className="surface-low rounded-2xl p-5">
            <p className="font-headline font-bold text-sm mb-3">💡 Tips for best results</p>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium">
              <li>• Make sure all text is readable in the photo</li>
              <li>• Crop tightly around the timetable grid</li>
              <li>• Good lighting helps AI accuracy</li>
              <li>• Day headers (Mon, Tue…) and times must be visible</li>
            </ul>
          </div>

          <button
            onClick={() => nav("/app/subjects/manual")}
            className="w-full surface-low rounded-3xl p-6 flex items-center gap-4 tap-scale border border-border/50"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center shrink-0">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 26 }}>edit_calendar</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-headline font-bold text-base">Enter manually</p>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Add subjects with day & time slots</p>
            </div>
            <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: 22 }}>chevron_right</span>
          </button>
        </div>
      )}

      {stage === "extracting" && (
        <div className="flex flex-col items-center gap-5 py-10">
          {preview && (
            <div className="relative w-full max-w-xs rounded-2xl overflow-hidden shadow-glow">
              <img src={preview} alt="timetable" className="w-full" />
              <div className="absolute inset-0 bg-primary/10 animate-pulse" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="font-headline font-bold">AI is reading your timetable…</p>
          </div>
          <p className="text-xs text-muted-foreground font-medium text-center max-w-xs">
            Detecting subjects, days and time slots. This usually takes 10–30 seconds.
          </p>
        </div>
      )}

      {stage === "review" && (
        <div className="space-y-5">
          <div className="surface-low rounded-2xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">check_circle</span>
            <div className="flex-1">
              <p className="font-headline font-bold text-sm">Review & edit</p>
              <p className="text-[11px] text-muted-foreground font-medium">Tap any field to fix mistakes before saving</p>
            </div>
          </div>

          {extracted.map((s, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 shadow-card space-y-3">
              <div className="flex items-start gap-2">
                <Input
                  value={s.name}
                  onChange={(e) => updateSubject(i, { name: e.target.value })}
                  className="font-headline font-bold text-base h-11 rounded-xl"
                  placeholder="Subject name"
                />
                <button
                  onClick={() => removeSubject(i)}
                  className="h-11 w-11 grid place-items-center rounded-xl bg-destructive-container text-destructive-container-foreground tap-scale shrink-0"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                </button>
              </div>
              <Input
                value={s.faculty}
                onChange={(e) => updateSubject(i, { faculty: e.target.value })}
                className="h-10 rounded-xl text-sm"
                placeholder="Faculty (optional)"
              />

              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.periods.length} class{s.periods.length === 1 ? "" : "es"}/week
                </p>
                {s.periods.map((p, pi) => (
                  <div key={pi} className="flex items-center gap-2 surface-low rounded-xl p-2.5">
                    <span className={cn(
                      "h-8 px-2.5 grid place-items-center rounded-lg text-xs font-headline font-bold gradient-primary text-white shrink-0",
                    )}>
                      {DAYS[p.day_of_week]}
                    </span>
                    <span className="text-xs font-semibold flex-1 truncate">
                      {fmtTime(p.start_time + (p.start_time.length === 5 ? ":00" : ""))} – {fmtTime(p.end_time + (p.end_time.length === 5 ? ":00" : ""))}
                    </span>
                    {p.room && <span className="text-[10px] text-muted-foreground font-medium truncate">{p.room}</span>}
                    <button
                      onClick={() => removePeriod(i, pi)}
                      className="h-7 w-7 grid place-items-center rounded-lg text-muted-foreground tap-scale"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => { setStage("upload"); setExtracted([]); setPreview(null); }}
              variant="outline"
              className="h-14 rounded-2xl border-0 surface-high font-headline font-bold"
            >
              Retry
            </Button>
            <Button
              onClick={save}
              disabled={importMut.isPending}
              className="h-14 rounded-2xl gradient-primary border-0 shadow-glow text-white font-headline font-bold"
            >
              {importMut.isPending ? "Saving…" : `Save ${extracted.length}`}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

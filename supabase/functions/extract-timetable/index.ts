// Extract timetable structure from an image using Lovable AI (vision + tool calling)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return json({ error: "imageBase64 is required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${imageBase64}`;

    const systemPrompt = `You are an expert at reading school/college timetable images.
Carefully look at the image (rows, columns, headers) and extract every scheduled class.
- Detect day-of-week columns (Mon, Tue, ...). Map: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6.
- Detect time rows (e.g. "9:00-10:00" or "09:00 AM"). Convert all times to 24h "HH:MM".
- Group same subject across different days/times into ONE subject with multiple periods.
- Ignore breaks, lunch, free periods, empty cells.
- If a faculty/teacher name is shown alongside a subject, capture it.
- If a room/venue is shown, capture it. Otherwise null.
Be thorough — return EVERY class you can see.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the full timetable from this image. Return all subjects with all their day+time slots." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_timetable",
              description: "Save extracted timetable as a list of subjects with their weekly periods",
              parameters: {
                type: "object",
                properties: {
                  subjects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Subject/course name" },
                        faculty: { type: "string", description: "Teacher name, or empty string" },
                        periods: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              day_of_week: { type: "integer", minimum: 0, maximum: 6 },
                              start_time: { type: "string", description: "24h HH:MM" },
                              end_time: { type: "string", description: "24h HH:MM" },
                              room: { type: "string", description: "Room/venue or empty string" },
                            },
                            required: ["day_of_week", "start_time", "end_time", "room"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["name", "faculty", "periods"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["subjects"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_timetable" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      if (resp.status === 429) return json({ error: "Rate limit exceeded. Try again shortly." }, 429);
      if (resp.status === 402) return json({ error: "AI credits exhausted. Add funds in Workspace settings." }, 402);
      return json({ error: "AI extraction failed" }, 500);
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: "No structured response from AI" }, 500);

    const args = JSON.parse(toolCall.function.arguments);
    return json(args);
  } catch (e) {
    console.error("extract-timetable error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

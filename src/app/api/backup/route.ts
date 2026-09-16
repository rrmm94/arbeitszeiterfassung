import { exportBackup, importBackup } from "@/lib/services/backup";
import { isoDate } from "@/lib/time";
import { NextResponse } from "next/server";

export async function GET() {
  const backup = await exportBackup();
  const filename = `arbeitszeit-backup-${isoDate(new Date())}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten" }, { status: 400 });
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const result = await importBackup(data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import fehlgeschlagen" },
      { status: 400 }
    );
  }
}

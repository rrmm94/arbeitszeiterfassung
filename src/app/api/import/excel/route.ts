import { importExcelBuffer } from "@/lib/services/excel-import";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei erhalten" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();

  try {
    const result = await importExcelBuffer(buffer);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import fehlgeschlagen" },
      { status: 500 }
    );
  }
}

import { db } from "@/lib/db";
import { dateOnly } from "@/lib/time";

const API_BASE = "https://openholidaysapi.org";

interface ApiHolidayName {
  language: string;
  text: string;
}

interface ApiHoliday {
  startDate: string;
  endDate: string;
  name: ApiHolidayName[];
}

function germanName(names: ApiHolidayName[]): string {
  return names.find((n) => n.language === "DE")?.text ?? names[0]?.text ?? "Unbekannt";
}

function toUtcDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return dateOnly(y, m, d);
}

/**
 * Lädt Feiertage und Schulferien für ein Bundesland (z.B. "DE-NI") im angegebenen
 * Zeitraum von der öffentlichen OpenHolidaysAPI und speichert sie in der Datenbank.
 * Bereits manuell angepasste Einträge (source = "manual") werden nicht überschrieben.
 */
export async function refreshHolidays(federalState: string, validFrom: Date, validTo: Date) {
  const params = new URLSearchParams({
    countryIsoCode: "DE",
    languageIsoCode: "DE",
    subdivisionCode: federalState,
    validFrom: validFrom.toISOString().slice(0, 10),
    validTo: validTo.toISOString().slice(0, 10),
  });

  const [publicRes, schoolRes] = await Promise.all([
    fetch(`${API_BASE}/PublicHolidays?${params.toString()}`),
    fetch(`${API_BASE}/SchoolHolidays?${params.toString()}`),
  ]);

  if (!publicRes.ok || !schoolRes.ok) {
    throw new Error("Feiertags-/Ferien-API nicht erreichbar");
  }

  const publicHolidays: ApiHoliday[] = await publicRes.json();
  const schoolHolidays: ApiHoliday[] = await schoolRes.json();

  let publicCount = 0;
  for (const h of publicHolidays) {
    const date = toUtcDate(h.startDate);
    const existing = await db.publicHoliday.findUnique({ where: { date } });
    if (existing?.source === "manual") continue;
    await db.publicHoliday.upsert({
      where: { date },
      update: { name: germanName(h.name), source: "api" },
      create: { date, name: germanName(h.name), source: "api" },
    });
    publicCount++;
  }

  let vacationCount = 0;
  for (const h of schoolHolidays) {
    const startDate = toUtcDate(h.startDate);
    const endDate = toUtcDate(h.endDate);
    const name = germanName(h.name);
    const existing = await db.schoolVacation.findFirst({
      where: { startDate, endDate, name },
    });
    if (existing) {
      if (existing.source === "manual") continue;
      await db.schoolVacation.update({ where: { id: existing.id }, data: { source: "api" } });
    } else {
      await db.schoolVacation.create({ data: { startDate, endDate, name, source: "api" } });
    }
    vacationCount++;
  }

  return { publicCount, vacationCount };
}

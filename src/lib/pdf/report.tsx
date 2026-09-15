import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RangeSummary } from "@/lib/aggregate";
import { formatHours, isoDate } from "@/lib/time";

const STATUS_LABELS: Record<string, string> = {
  WERKTAG: "Werktag",
  WOCHENENDE: "Wochenende",
  FEIERTAG: "Feiertag",
  FERIEN: "Ferien",
  KRANK: "Krank",
  URLAUB: "Urlaub",
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#2b2926" },
  title: { fontSize: 16, marginBottom: 2, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#6f6d68", marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statBox: { flex: 1, borderWidth: 1, borderColor: "#e6e4df", borderRadius: 4, padding: 8 },
  statLabel: { fontSize: 8, color: "#6f6d68", marginBottom: 3, textTransform: "uppercase" },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  table: { width: "100%", borderWidth: 1, borderColor: "#e6e4df", borderRadius: 2 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e6e4df" },
  trHeader: { flexDirection: "row", backgroundColor: "#f2f1ee", borderBottomWidth: 1, borderBottomColor: "#e6e4df" },
  td: { padding: 4, fontSize: 8 },
  th: { padding: 4, fontSize: 8, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 7, color: "#a3a19b", textAlign: "center" },
});

export function SummaryDocument({
  title,
  rangeLabel,
  summary,
}: {
  title: string;
  rangeLabel: string;
  summary: RangeSummary;
}) {
  const t = summary.totals;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{rangeLabel} · erstellt am {isoDate(new Date())}</Text>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Arbeitszeit (Ist)</Text>
            <Text style={styles.statValue}>{formatHours(t.nettoHours)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Soll</Text>
            <Text style={styles.statValue}>{formatHours(t.sollHours)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Differenz</Text>
            <Text style={styles.statValue}>{t.diffHours >= 0 ? "+" : ""}{formatHours(t.diffHours)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Blöcke</Text>
            <Text style={styles.statValue}>{t.blocksWorked} / {t.blocksSoll}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aufteilung</Text>
        <View style={styles.table}>
          <View style={styles.trHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Bereich</Text>
            <Text style={[styles.th, { flex: 1 }]}>Stunden</Text>
          </View>
          {[
            ["Schule", t.schoolHours],
            ["Außerschulisch", t.homeHours],
            ["Wochenende (zusätzlich)", t.weekendHours],
            ["Feiertage (zusätzlich)", t.holidayHours],
            ["Ferien (zusätzlich)", t.ferienHours],
          ].map(([label, hours], i) => (
            <View style={styles.tr} key={i}>
              <Text style={[styles.td, { flex: 2 }]}>{label as string}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{formatHours(hours as number)}</Text>
            </View>
          ))}
        </View>

        {t.homeHoursByCategory.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Außerschulische Kategorien</Text>
            <View style={styles.table}>
              <View style={styles.trHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Kategorie</Text>
                <Text style={[styles.th, { flex: 1 }]}>Stunden</Text>
              </View>
              {t.homeHoursByCategory.map((c, i) => (
                <View style={styles.tr} key={i}>
                  <Text style={[styles.td, { flex: 2 }]}>{c.name}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{formatHours(c.hours)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Abwesenheiten</Text>
        <View style={styles.table}>
          <View style={styles.trHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Art</Text>
            <Text style={[styles.th, { flex: 1 }]}>Anzahl</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { flex: 2 }]}>Krankheitstage</Text>
            <Text style={[styles.td, { flex: 1 }]}>{t.sickDays}</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { flex: 2 }]}>Urlaubstage</Text>
            <Text style={[styles.td, { flex: 1 }]}>{t.vacationDaysUsed}</Text>
          </View>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

export function CalendarDocument({
  title,
  rangeLabel,
  summary,
}: {
  title: string;
  rangeLabel: string;
  summary: RangeSummary;
}) {
  const rows = summary.days.filter((d) => d.hasEntry || d.status !== "WERKTAG" || d.nettoHours > 0);
  const chunks: (typeof rows)[] = [];
  for (let i = 0; i < rows.length; i += 32) chunks.push(rows.slice(i, i + 32));
  if (chunks.length === 0) chunks.push([]);

  return (
    <Document>
      {chunks.map((chunk, pageIdx) => (
        <Page size="A4" style={styles.page} key={pageIdx}>
          {pageIdx === 0 && (
            <>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{rangeLabel} · erstellt am {isoDate(new Date())}</Text>
            </>
          )}
          <View style={styles.table}>
            <View style={styles.trHeader}>
              <Text style={[styles.th, { width: "12%" }]}>Datum</Text>
              <Text style={[styles.th, { width: "13%" }]}>Status</Text>
              <Text style={[styles.th, { width: "12%" }]}>Schule</Text>
              <Text style={[styles.th, { width: "14%" }]}>Außerschul.</Text>
              <Text style={[styles.th, { width: "10%" }]}>Blöcke</Text>
              <Text style={[styles.th, { width: "12%" }]}>Netto</Text>
              <Text style={[styles.th, { width: "12%" }]}>Soll</Text>
              <Text style={[styles.th, { width: "15%" }]}>Diff.</Text>
            </View>
            {chunk.map((d, i) => (
              <View style={styles.tr} key={i}>
                <Text style={[styles.td, { width: "12%" }]}>{isoDate(d.date)}</Text>
                <Text style={[styles.td, { width: "13%" }]}>{STATUS_LABELS[d.status]}</Text>
                <Text style={[styles.td, { width: "12%" }]}>{formatHours(d.schoolMinutes / 60)}</Text>
                <Text style={[styles.td, { width: "14%" }]}>{formatHours(d.homeMinutes / 60)}</Text>
                <Text style={[styles.td, { width: "10%" }]}>{d.blocksWorked}/{d.blocksSoll}</Text>
                <Text style={[styles.td, { width: "12%" }]}>{formatHours(d.nettoHours)}</Text>
                <Text style={[styles.td, { width: "12%" }]}>{formatHours(d.sollHours)}</Text>
                <Text style={[styles.td, { width: "15%" }]}>{d.diffHours >= 0 ? "+" : ""}{formatHours(d.diffHours)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} / ${totalPages}`} fixed />
        </Page>
      ))}
    </Document>
  );
}

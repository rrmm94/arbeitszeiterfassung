# Arbeitszeit

Selbst gehostete Arbeitszeiterfassung für Lehrkräfte in Niedersachsen (75-Minuten-Blockmodell).
Erfasst Schulzeit, außerschulische Arbeit (kategorisiert), Unterrichtsblöcke, Pausen, Krankheit
und Urlaub – und vergleicht das mit dem Soll aus dem hinterlegten Stundenplan bzw. einer
klassischen 40h-Woche.

## Funktionen

- Dashboard mit Monatsübersicht, Über-/Minderstunden, Auslastung, Verlauf der letzten Kalenderwochen
- Kalenderansicht mit Farbkennzeichnung (Werktag/Wochenende/Feiertag/Ferien/Krank/Urlaub)
- Stundenplan-Editor für 1. und 2. Halbjahr (Unterricht/Bereitschaft/Frei je Block und Wochentag)
- Automatischer Abgleich von Ist- und Soll-Arbeitszeit sowie Unterrichtsblöcken
- Automatisches Laden von Feiertagen & Schulferien (OpenHolidaysAPI), manuell überschreibbar
- Krankmeldungen und Urlaub als Zeiträume, fließen korrekt in die Berechnung ein
- Frei definierbare Kategorien für außerschulische Arbeit
- PDF-Export (Zusammenfassung oder vollständiger Kalender) für Schuljahr/Halbjahr/Monat/Zeitraum
- Einmaliger Import der bisherigen Excel-Arbeitszeiterfassung
- Minimalistisches Design mit Light- und Dark-Mode

## Lokale Entwicklung

Voraussetzung: Node.js 20+.

```bash
npm install
npm run db:migrate   # legt prisma/dev.db an
npm run db:seed       # Standard-Blockzeiten & Kategorien
npm run dev
```

App läuft unter http://localhost:3000.

## Deployment auf Unraid (Docker)

1. Repository auf den Unraid-Server bringen (z.B. per `git clone` in ein Verzeichnis wie
   `/mnt/user/appdata/arbeitszeit-src`).
2. Mit Docker Compose starten:

   ```bash
   docker compose up -d --build
   ```

   Das legt automatisch einen Ordner `./data` an, in dem die SQLite-Datenbank
   (`app.db`) persistent gespeichert wird. Beim Start werden Datenbank-Migrationen
   automatisch ausgeführt.

3. App ist danach unter `http://<unraid-ip>:3000` erreichbar. Der Port lässt sich in
   `docker-compose.yml` anpassen.

4. Über die Unraid-GUI kann das Compose-Setup alternativ auch über das
   "Docker Compose Manager"-Plugin eingebunden werden, falls kein Terminalzugriff
   gewünscht ist.

### Update

```bash
git pull
docker compose up -d --build
```

Die Datenbank in `./data` bleibt dabei erhalten.

### Excel-Import

Unter **Einstellungen → Excel-Import** kann einmalig die bisherige
`.xlsx`-Arbeitszeiterfassung hochgeladen werden. Schul-/Zusatzzeiten, Pausen,
Blockanzahl und Notizen werden übernommen; Kranktage und Urlaub werden als
Zeiträume angelegt. Feiertage/Ferien werden nicht importiert, da diese automatisch
geladen werden.

## Technik

Next.js (App Router) · TypeScript · Prisma + SQLite · Tailwind CSS 4 · Recharts ·
@react-pdf/renderer · OpenHolidaysAPI

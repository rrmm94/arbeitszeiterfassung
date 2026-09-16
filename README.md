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
- Tage ohne Unterricht (Fortbildung, Exkursion) als solche markierbar – Unterrichtsblöcke-Soll entfällt,
  Arbeitszeit-Soll bleibt bestehen
- Frei definierbare Kategorien für außerschulische Arbeit
- PDF-Export (Zusammenfassung oder vollständiger Kalender) für Schuljahr/Halbjahr/Monat/Zeitraum
- Einmaliger Import der bisherigen Excel-Arbeitszeiterfassung
- Vollständiges Datenbank-Backup (Export/Import als JSON) unter Einstellungen → Backup
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

1. Auf dem Unraid-Server ein Terminal öffnen (Web-GUI oben rechts das "​>_"-Symbol, oder per SSH)
   und einen Ordner unter `appdata` anlegen (der wird von den meisten Unraid-Backup-Plugins
   mitgesichert):

   ```bash
   mkdir -p /mnt/user/appdata/arbeitszeit-src
   cd /mnt/user/appdata/arbeitszeit-src
   ```

2. Repository herunterladen. Falls `git` installiert ist (z.B. über das "NerdTools"-Plugin aus
   den Community Applications):

   ```bash
   git clone https://github.com/rrmm94/arbeitszeiterfassung.git .
   ```

   Ohne `git` geht es auch ohne zusätzliche Installation direkt per `curl`:

   ```bash
   curl -L https://github.com/rrmm94/arbeitszeiterfassung/archive/refs/heads/main.tar.gz | tar xz --strip-components=1
   ```

3. Mit Docker Compose starten (falls `docker compose` nicht erkannt wird, `docker-compose`
   mit Bindestrich probieren):

   ```bash
   docker compose up -d --build
   ```

   Das legt automatisch einen Ordner `./data` an, in dem die SQLite-Datenbank
   (`app.db`) persistent gespeichert wird. Beim Start werden Datenbank-Migrationen
   automatisch ausgeführt.

4. App ist danach unter `http://<unraid-ip>:7536` erreichbar. Der Port lässt sich in
   `docker-compose.yml` über den ersten Wert bei `ports` (Host-Port) anpassen.

5. Über die Unraid-GUI kann das Compose-Setup alternativ auch über das
   "Compose Manager"-Plugin (Community Applications) verwaltet werden, falls für
   Neustarts/Logs kein Terminalzugriff gewünscht ist.

### Update

Mit `git` geklont:

```bash
git pull
docker compose up -d --build
```

Ohne `git` (Tarball erneut über die bestehenden Dateien entpacken):

```bash
curl -L https://github.com/rrmm94/arbeitszeiterfassung/archive/refs/heads/main.tar.gz | tar xz --strip-components=1
docker compose up -d --build
```

Die Datenbank in `./data` bleibt in beiden Fällen erhalten, da sie außerhalb des
Quellcode-Ordners in einem eigenen Docker-Volume-Verzeichnis liegt.

### Excel-Import

Unter **Einstellungen → Excel-Import** kann einmalig die bisherige
`.xlsx`-Arbeitszeiterfassung hochgeladen werden. Schul-/Zusatzzeiten, Pausen,
Blockanzahl und Notizen werden übernommen; Kranktage und Urlaub werden als
Zeiträume angelegt. Feiertage/Ferien werden nicht importiert, da diese automatisch
geladen werden.

## Technik

Next.js (App Router) · TypeScript · Prisma + SQLite · Tailwind CSS 4 · Recharts ·
@react-pdf/renderer · OpenHolidaysAPI

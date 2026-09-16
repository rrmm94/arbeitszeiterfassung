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

Das Repository ist **privat**. Zum Klonen auf dem Server wird deshalb ein schreibgeschützter
SSH-Deploy-Key verwendet (nur Lesezugriff auf genau dieses Repo) statt eines normalen
GitHub-Logins.

1. Auf Unraid `git` installieren: Community Applications → Plugin **"NerdTools"** installieren
   → in den NerdTools-Einstellungen das Paket **git** aktivieren.

2. Den privaten Deploy-Key auf dem Server ablegen (Inhalt liegt beim Repo-Owner bzw. wurde ihm
   einmalig mitgeteilt):

   ```bash
   mkdir -p ~/.ssh
   nano ~/.ssh/arbeitszeit_deploy_key   # Inhalt einfügen, speichern
   chmod 600 ~/.ssh/arbeitszeit_deploy_key
   ```

3. Ordner anlegen und Repository per SSH klonen (der Ordner liegt unter `appdata`, damit er von
   den meisten Unraid-Backup-Plugins mitgesichert wird):

   ```bash
   mkdir -p /mnt/user/appdata/arbeitszeit-src
   cd /mnt/user/appdata/arbeitszeit-src
   GIT_SSH_COMMAND="ssh -i ~/.ssh/arbeitszeit_deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
     git clone git@github.com:rrmm94/arbeitszeiterfassung.git .
   ```

4. Mit Docker Compose starten (falls `docker compose` nicht erkannt wird, `docker-compose`
   mit Bindestrich probieren):

   ```bash
   docker compose up -d --build
   ```

   Das legt automatisch einen Ordner `./data` an, in dem die SQLite-Datenbank
   (`app.db`) persistent gespeichert wird. Beim Start werden Datenbank-Migrationen
   automatisch ausgeführt.

5. App ist danach unter `http://<unraid-ip>:7536` erreichbar. Der Port lässt sich in
   `docker-compose.yml` über den ersten Wert bei `ports` (Host-Port) anpassen.

6. Über die Unraid-GUI kann das Compose-Setup alternativ auch über das
   "Compose Manager"-Plugin (Community Applications) verwaltet werden, falls für
   Neustarts/Logs kein Terminalzugriff gewünscht ist.

### Update

```bash
cd /mnt/user/appdata/arbeitszeit-src
GIT_SSH_COMMAND="ssh -i ~/.ssh/arbeitszeit_deploy_key -o IdentitiesOnly=yes" git pull
docker compose up -d --build
```

Die Datenbank in `./data` bleibt dabei erhalten, da sie außerhalb des Quellcode-Ordners in
einem eigenen Docker-Volume-Verzeichnis liegt.

### Deploy-Key verwalten

Der SSH-Deploy-Key hat ausschließlich Lesezugriff auf dieses eine Repository (kein Zugriff auf
den restlichen GitHub-Account). Verwaltet wird er unter GitHub → dieses Repo → **Settings →
Deploy keys**; dort lässt er sich jederzeit widerrufen und durch einen neuen ersetzen, falls
z.B. der Unraid-Server einmal neu aufgesetzt wird.

### Excel-Import

Unter **Einstellungen → Excel-Import** kann einmalig die bisherige
`.xlsx`-Arbeitszeiterfassung hochgeladen werden. Schul-/Zusatzzeiten, Pausen,
Blockanzahl und Notizen werden übernommen; Kranktage und Urlaub werden als
Zeiträume angelegt. Feiertage/Ferien werden nicht importiert, da diese automatisch
geladen werden.

## Technik

Next.js (App Router) · TypeScript · Prisma + SQLite · Tailwind CSS 4 · Recharts ·
@react-pdf/renderer · OpenHolidaysAPI

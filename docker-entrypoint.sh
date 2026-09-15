#!/bin/sh
set -e

mkdir -p /app/data

echo "Führe Datenbank-Migrationen aus…"
npx prisma migrate deploy

echo "Stelle Standardwerte sicher (Blockzeiten, Kategorien)…"
npx prisma db seed

echo "Starte Arbeitszeiterfassung auf Port 3000…"
exec npx next start -H 0.0.0.0 -p 3000

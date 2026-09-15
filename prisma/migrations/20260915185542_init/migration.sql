-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "fullTimeUE" REAL NOT NULL DEFAULT 25.5,
    "fullTimeBlocks" REAL NOT NULL DEFAULT 15,
    "employmentFactor" REAL NOT NULL DEFAULT 1.0,
    "compareWeeklyHours" REAL NOT NULL DEFAULT 40,
    "compareVacationDays" REAL NOT NULL DEFAULT 30,
    "vacationDaysPerYear" REAL NOT NULL DEFAULT 30,
    "schoolYearStartMonth" INTEGER NOT NULL DEFAULT 8,
    "halfYearSwitchMonth" INTEGER NOT NULL DEFAULT 2,
    "halfYearSwitchDay" INTEGER NOT NULL DEFAULT 1,
    "federalState" TEXT NOT NULL DEFAULT 'DE-NI',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BlockDefinition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "halfYear" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FREI',
    "subject" TEXT,
    "room" TEXT
);

-- CreateTable
CREATE TABLE "WorkCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api'
);

-- CreateTable
CREATE TABLE "SchoolVacation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'api'
);

-- CreateTable
CREATE TABLE "SickLeave" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "Vacation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "DayEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "blocksOverride" INTEGER,
    "blocksOverrideReason" TEXT,
    "scheduleNote" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SchoolSegment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayEntryId" INTEGER NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    CONSTRAINT "SchoolSegment_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "DayEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeSegment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayEntryId" INTEGER NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT,
    CONSTRAINT "HomeSegment_dayEntryId_fkey" FOREIGN KEY ("dayEntryId") REFERENCES "DayEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HomeSegment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WorkCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockDefinition_number_key" ON "BlockDefinition"("number");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_halfYear_weekday_blockNumber_key" ON "TimetableEntry"("halfYear", "weekday", "blockNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCategory_name_key" ON "WorkCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicHoliday_date_key" ON "PublicHoliday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DayEntry_date_key" ON "DayEntry"("date");

-- CreateIndex
CREATE INDEX "SchoolSegment_dayEntryId_idx" ON "SchoolSegment"("dayEntryId");

-- CreateIndex
CREATE INDEX "HomeSegment_dayEntryId_idx" ON "HomeSegment"("dayEntryId");

-- CreateIndex
CREATE INDEX "HomeSegment_categoryId_idx" ON "HomeSegment"("categoryId");

-- CreateTable
CREATE TABLE "SpecialistDay" (
    "id" TEXT NOT NULL,
    "specialistId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialistDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialistDay_specialistId_idx" ON "SpecialistDay"("specialistId");

-- CreateIndex
CREATE INDEX "SpecialistDay_date_idx" ON "SpecialistDay"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialistDay_specialistId_date_key" ON "SpecialistDay"("specialistId", "date");

-- AddForeignKey
ALTER TABLE "SpecialistDay" ADD CONSTRAINT "SpecialistDay_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

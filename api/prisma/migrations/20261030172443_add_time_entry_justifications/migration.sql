-- CreateTable
CREATE TABLE "time_entry_justifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employee_id" TEXT NOT NULL,
    "time_entry_id" TEXT NOT NULL,
    "approved_by_id" TEXT NOT NULL,
    CONSTRAINT "time_entry_justifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "time_entry_justifications_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time-entry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "time_entry_justifications_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "time_entry_justifications_employee_id_idx" ON "time_entry_justifications"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_entry_justifications_time_entry_id_type_key" ON "time_entry_justifications"("time_entry_id", "type");

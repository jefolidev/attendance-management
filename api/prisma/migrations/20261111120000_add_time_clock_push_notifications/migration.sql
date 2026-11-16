CREATE TABLE "employee_push_subscriptions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "employee_id" TEXT NOT NULL,
  CONSTRAINT "employee_push_subscriptions_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "employee_push_subscriptions_endpoint_key"
  ON "employee_push_subscriptions"("endpoint");
CREATE INDEX "employee_push_subscriptions_employee_id_idx"
  ON "employee_push_subscriptions"("employee_id");

CREATE TABLE "time_clock_notification_deliveries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "employee_id" TEXT NOT NULL,
  "date_key" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "time_clock_notification_deliveries_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "time_clock_notification_deliveries_employee_id_date_key_kind_key"
  ON "time_clock_notification_deliveries"("employee_id", "date_key", "kind");
CREATE INDEX "time_clock_notification_deliveries_date_key_idx"
  ON "time_clock_notification_deliveries"("date_key");

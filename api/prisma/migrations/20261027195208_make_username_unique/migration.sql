/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "employees_username_key" ON "employees"("username");

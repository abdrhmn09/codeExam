/*
  Warnings:

  - A unique constraint covering the columns `[npm]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "npm" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_npm_key" ON "User"("npm");

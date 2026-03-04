-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseReturn" ADD COLUMN     "staffId" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "roleId" TEXT;

-- CreateTable
CREATE TABLE "StaffRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "StaffRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffRole_storeId_idx" ON "StaffRole"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRole_name_storeId_key" ON "StaffRole"("name", "storeId");

-- CreateIndex
CREATE INDEX "Purchase_staffId_idx" ON "Purchase"("staffId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_staffId_idx" ON "PurchaseReturn"("staffId");

-- CreateIndex
CREATE INDEX "Staff_roleId_idx" ON "Staff"("roleId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "StaffRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRole" ADD CONSTRAINT "StaffRole_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

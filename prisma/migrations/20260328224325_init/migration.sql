-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "pillars" TEXT NOT NULL,
    "toneNotes" TEXT,
    "colors" TEXT NOT NULL,
    "fonts" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoVariants" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

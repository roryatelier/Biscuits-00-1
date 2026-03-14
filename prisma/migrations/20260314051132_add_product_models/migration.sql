-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Brief',
    "category" TEXT,
    "market" TEXT,
    "claims" TEXT,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Formulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "market" TEXT,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "teamId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Formulation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Formulation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "casNumber" TEXT,
    "function" TEXT,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "FormulationIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formulationId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "percentage" REAL,
    "role" TEXT,
    CONSTRAINT "FormulationIngredient_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormulationIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectFormulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "formulationId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectFormulation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectFormulation_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackagingOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "format" TEXT,
    "material" TEXT,
    "moq" INTEGER,
    "unitCost" REAL,
    "leadTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "description" TEXT,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PackagingOption_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SampleOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "formulationId" TEXT NOT NULL,
    "projectId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "format" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "shippingAddress" TEXT,
    "notes" TEXT,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SampleOrder_formulationId_fkey" FOREIGN KEY ("formulationId") REFERENCES "Formulation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SampleOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SampleOrder_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SampleOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SampleReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sampleOrderId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "texture" INTEGER,
    "scent" INTEGER,
    "colour" INTEGER,
    "overall" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SampleReview_sampleOrderId_fkey" FOREIGN KEY ("sampleOrderId") REFERENCES "SampleOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SampleReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "reviewId" TEXT,
    "packagingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Upload_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SampleReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Upload_packagingId_fkey" FOREIGN KEY ("packagingId") REFERENCES "PackagingOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FormulationIngredient_formulationId_ingredientId_key" ON "FormulationIngredient"("formulationId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFormulation_projectId_formulationId_key" ON "ProjectFormulation"("projectId", "formulationId");

-- CreateIndex
CREATE UNIQUE INDEX "SampleOrder_reference_key" ON "SampleOrder"("reference");

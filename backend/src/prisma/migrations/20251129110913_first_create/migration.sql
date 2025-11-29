-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nick" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileSystemLocal" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "pathLocal" TEXT NOT NULL,
    "pathBD" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileSystemLocal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileSystemReference" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "pathBD" TEXT NOT NULL,

    CONSTRAINT "FileSystemReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckHistory" (
    "id" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nick_key" ON "User"("nick");

-- CreateIndex
CREATE UNIQUE INDEX "FileSystemLocal_fileName_key" ON "FileSystemLocal"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "FileSystemReference_fileName_key" ON "FileSystemReference"("fileName");

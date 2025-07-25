// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  CENTRE_CHIEF
  BASE_CHIEF
  OPERATOR
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  name        String
  role        Role
  centreId    String?  
  baseId      String?  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deleted     Boolean  @default(false)

  base        Base?    @relation(fields: [baseId], references: [id])
  centre      Centre?  @relation(fields: [centreId], references: [id])
}

model Centre {
  id        String   @id @default(uuid())
  name      String
  region    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  bases     Base[]
}

model Base {
  id        String   @id @default(uuid())
  name      String
  centreId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deleted   Boolean  @default(false)

  centre    Centre   @relation(fields: [centreId], references: [id])
  basins    Basin[]
  users     User[]
}

model Basin {
  id          String    @id @default(uuid())
  name        String
  baseId      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deleted     Boolean   @default(false)

  base        Base      @relation(fields: [baseId], references: [id])
  readings    Reading[]
  alerts      Alert[]
}

model Reading {
  id          String   @id @default(uuid())
  basinId     String
  ph          Float
  temperature Float
  oxygen      Float
  salinity    Float
  turbidity   Float?
  timestamp   DateTime

  basin       Basin    @relation(fields: [basinId], references: [id])
}

model Alert {
  id          String   @id @default(uuid())
  basinId     String
  parameter   String
  value       Float
  message     String
  timestamp   DateTime @default(now())

  basin       Basin    @relation(fields: [basinId], references: [id])
}

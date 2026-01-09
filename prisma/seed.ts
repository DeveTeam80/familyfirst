import { PrismaClient, RelationshipType } from "@prisma/client";
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const FAMILY_NAME = "Isaac-Gomez-Hale Family";

// ------------------------------------------
// HELPER: Hash Password (Inline to avoid import errors)
// ------------------------------------------
async function hashPassword(password: string) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// ------------------------------------------
// HELPER: Split Name
// ------------------------------------------
const splitName = (fullName: string) => {
  const parts = fullName.trim().split(" ");
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || ""
  };
};

async function main() {
  console.log("🌱 Starting JSON Database Seed...\n");

  // ============================================
  // 1. SETUP ADMIN USER (Securely Hashed)
  // ============================================
  const adminEmail = "maxbrutin@gmail.com";
  const plainTextPassword = "admin123"; 

  console.log(`👤 Setting up admin: ${adminEmail}...`);
  
  // Hash the password right here
  const securePasswordHash = await hashPassword(plainTextPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: securePasswordHash, // Update password if user exists
    },
    create: {
      email: adminEmail,
      name: "Keith Issac",
      passwordHash: securePasswordHash,
      emailVerified: new Date(),
    },
  });

  // ============================================
  // 2. SETUP FAMILY
  // ============================================
  const family = await prisma.family.create({
    data: {
      name: FAMILY_NAME,
      createdBy: adminUser.id,
      inviteCode: `IMPORT_${Date.now()}` // Simple unique code
    }
  });

  // ============================================
  // 3. READ JSON DATA
  // ============================================
  const jsonPath = path.join(__dirname, 'familyData.json');
  console.log(`📂 Reading data from ${jsonPath}...`);
  
  if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at ${jsonPath}. Please create familyData.json inside the prisma folder.`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const familyUnits = JSON.parse(rawData);

  // ============================================
  // 4. CREATE PEOPLE NODES
  // ============================================
  console.log("🌳 Creating people...");
  const nameToIdMap = new Map<string, string>();

  const ensurePerson = async (fullName: string) => {
    const cleanName = fullName.trim();
    if (!cleanName) return null;
    
    // Check memory map first
    if (nameToIdMap.has(cleanName)) return nameToIdMap.get(cleanName);

    const { firstName, lastName } = splitName(cleanName);
    
    // Create in Database
    const node = await prisma.familyTreeNode.create({
      data: {
        familyId: family.id,
        firstName,
        lastName,
        createdBy: adminUser.id
      }
    });

    nameToIdMap.set(cleanName, node.id);
    return node.id;
  };

  // Pre-scan to create everyone
  for (const unit of familyUnits) {
    for (const p of unit.parents) await ensurePerson(p);
    for (const c of unit.children) await ensurePerson(c);
  }

  // ============================================
  // 5. LINK RELATIONSHIPS
  // ============================================
  console.log("🔗 Linking relationships...");
  let relCount = 0;

  for (const unit of familyUnits) {
    const parentIds = await Promise.all(unit.parents.map((p: string) => ensurePerson(p)));
    const childIds = await Promise.all(unit.children.map((c: string) => ensurePerson(c)));

    const validParentIds = parentIds.filter((id): id is string => !!id);
    const validChildIds = childIds.filter((id): id is string => !!id);

    // A. Parents -> Children
    for (const pId of validParentIds) {
      for (const cId of validChildIds) {
        // Prevent duplicates
        const exists = await prisma.familyRelationship.findFirst({
          where: { person1Id: pId, person2Id: cId, relationshipType: RelationshipType.PARENT }
        });

        if (!exists) {
          await prisma.familyRelationship.create({
            data: { person1Id: pId, person2Id: cId, relationshipType: RelationshipType.PARENT }
          });
          relCount++;
        }
      }
    }

    // B. Spouse -> Spouse (if exactly 2 parents)
    if (validParentIds.length === 2) {
      const [p1, p2] = validParentIds;
      const exists = await prisma.familyRelationship.findFirst({
        where: {
          OR: [
            { person1Id: p1, person2Id: p2, relationshipType: RelationshipType.SPOUSE },
            { person1Id: p2, person2Id: p1, relationshipType: RelationshipType.SPOUSE }
          ]
        }
      });

      if (!exists) {
        await prisma.familyRelationship.create({
          data: { person1Id: p1, person2Id: p2, relationshipType: RelationshipType.SPOUSE }
        });
        relCount++;
      }
    }
  }

  console.log(`✅ Success! Created ${nameToIdMap.size} people and ${relCount} relationships.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
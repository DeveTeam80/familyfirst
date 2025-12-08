// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
// Make sure these imports actually exist in your project structure!
// If not, use regular bcryptjs here.
import { hashPassword, generateInviteCode } from "../src/lib/auth"; 
import { familyTreeData } from "../src/data/familyTree";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

// ============================================
  // 1. CREATE ADMIN USER
  // ============================================
  console.log("👤 Creating admin user...");
  
  const adminUser = await prisma.user.upsert({
    // FIX: Look for the ID, not the email
    where: { id: "demo-admin" }, 
    
    // Update ensuring the email is correct/fixed if it exists
    update: {
      email: "admin@familyfirst.com", // FIXED: familyfirst (not firstfamily)
      passwordHash: await hashPassword("admin123"),
      emailVerified: new Date(),
    },
    
    create: {
      id: "demo-admin",
      email: "admin@familyfirst.com", // FIXED: familyfirst
      name: "Admin User",
      passwordHash: await hashPassword("admin123"),
      emailVerified: new Date(),
    },
  });

  // 2. CREATE FAMILY
  console.log("👨‍👩‍👧‍👦 Creating family...");

  const family = await prisma.family.upsert({
    where: { id: "demo-family" },
    update: {},
    create: {
      id: "demo-family",
      name: "Isaac Family",
      description: "A wonderful family tree spanning multiple generations",
      inviteCode: generateInviteCode(),
      createdBy: adminUser.id,
    },
  });

  console.log(`✅ Family created: ${family.name}`);

  // 3. ADD ADMIN TO FAMILY
  await prisma.familyMember.upsert({
    where: {
      userId_familyId: { userId: adminUser.id, familyId: family.id },
    },
    update: {},
    create: {
      userId: adminUser.id,
      familyId: family.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // 4. CREATE NODES
  console.log("🌳 Creating family tree nodes...");
  let createdCount = 0;

  for (const node of familyTreeData) {
    try {
      // Handle date parsing safely
      let birthDate = null;
      if (node.data.birthday) {
         const bday = node.data.birthday;
         // if format is just "1980", add month/day. If "1980-05-01", use as is.
         birthDate = new Date(bday.length === 4 ? `${bday}-01-01` : bday);
      }

      await prisma.familyTreeNode.upsert({
        where: { id: node.id },
        update: {},
        create: {
          id: node.id,
          familyId: family.id,
          firstName: node.data["first name"],
          lastName: node.data["last name"] || null,
          birthDate: birthDate,
          gender: node.data.gender || null,
          photoUrl: node.data.avatar || null,
          createdBy: adminUser.id,
        },
      });
      createdCount++;
    } catch (error) {
      console.error(`Skipped node ${node.id}:`, error);
    }
  }
  console.log(`✅ Created ${createdCount} nodes`);

  // 5. RELATIONSHIPS
  console.log("🔗 Creating relationships...");
  
  for (const node of familyTreeData) {
    // A. Spouses
    if (node.rels?.spouses) {
      for (const spouseId of node.rels.spouses) {
        // Check existence first to avoid foreign key errors
        const p1 = await prisma.familyTreeNode.findUnique({ where: { id: node.id }});
        const p2 = await prisma.familyTreeNode.findUnique({ where: { id: spouseId }});

        if (p1 && p2) {
          // We use upsert to avoid crashing if we run seed twice
          await prisma.familyRelationship.upsert({
            where: {
              person1Id_person2Id_relationshipType: {
                person1Id: node.id,
                person2Id: spouseId,
                relationshipType: "SPOUSE",
              }
            },
            update: {},
            create: {
              person1Id: node.id,
              person2Id: spouseId,
              relationshipType: "SPOUSE",
            },
          });
        }
      }
    }

    // B. Parents (Fixed Logic)
    const parents = [
        { id: node.rels?.father, role: 'father' }, 
        { id: node.rels?.mother, role: 'mother' }
    ];

    for (const parent of parents) {
        if (parent.id) {
            const parentNode = await prisma.familyTreeNode.findUnique({ where: { id: parent.id }});
            const childNode = await prisma.familyTreeNode.findUnique({ where: { id: node.id }});

            if (parentNode && childNode) {
                await prisma.familyRelationship.upsert({
                    where: {
                        person1Id_person2Id_relationshipType: {
                            person1Id: parent.id,  // The Parent
                            person2Id: node.id,    // The Child
                            relationshipType: "PARENT", // <--- CORRECTED LOGIC
                        }
                    },
                    update: {},
                    create: {
                        person1Id: parent.id,
                        person2Id: node.id,
                        relationshipType: "PARENT",
                    }
                });
            }
        }
    }
  }
  console.log("✅ Relationships created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
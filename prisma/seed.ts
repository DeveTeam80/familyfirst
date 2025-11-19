// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateInviteCode } from "../src/lib/auth";

const prisma = new PrismaClient();

// Import your family tree data
import { familyTreeData } from "../src/data/familyTree";

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ============================================
  // 1. CREATE ADMIN USER
  // ============================================
  console.log("👤 Creating admin user...");
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@firstfamily.com" },
    update: {},
    create: {
      id: "demo-admin",
      email: "admin@firstfamily.com",
      name: "Admin User",
      passwordHash: await hashPassword("admin123"),
    },
  });

  console.log(`✅ Admin user created: ${adminUser.email}`);
  console.log(`   ID: ${adminUser.id}`);
  console.log(`   Password: admin123\n`);

  // ============================================
  // 2. CREATE FAMILY
  // ============================================
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
  console.log(`   ID: ${family.id}`);
  console.log(`   Invite Code: ${family.inviteCode}\n`);

  // ============================================
  // 3. ADD ADMIN TO FAMILY
  // ============================================
  console.log("🔗 Adding admin to family...");

  await prisma.familyMember.upsert({
    where: {
      userId_familyId: {
        userId: adminUser.id,
        familyId: family.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      familyId: family.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Admin added to family\n`);

  // ============================================
  // 4. CREATE FAMILY TREE NODES
  // ============================================
  console.log("🌳 Creating family tree nodes...");
  console.log(`   Total nodes to create: ${familyTreeData.length}\n`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const node of familyTreeData) {
    try {
      const treeNode = await prisma.familyTreeNode.upsert({
        where: { id: node.id },
        update: {},
        create: {
          id: node.id,
          familyId: family.id,
          firstName: node.data["first name"],
          lastName: node.data["last name"] || null,
          birthDate: node.data.birthday ? new Date(node.data.birthday + "-01-01") : null,
          gender: node.data.gender || null,
          photoUrl: node.data.avatar || null,
          createdBy: adminUser.id,
        },
      });

      createdCount++;
      console.log(
        `   ✅ ${createdCount.toString().padStart(2, "0")}. ${treeNode.firstName} ${
          treeNode.lastName || ""
        }`.trim()
      );
    } catch (error) {
      skippedCount++;
      console.error(
        `   ❌ Failed to create node: ${node.data["first name"]} ${
          node.data["last name"] || ""
        }`
      );
      console.error(`      Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\n✅ Created ${createdCount} tree nodes`);
  if (skippedCount > 0) {
    console.log(`⚠️  Skipped ${skippedCount} nodes due to errors`);
  }

  // ============================================
  // 5. CREATE FAMILY RELATIONSHIPS (OPTIONAL)
  // ============================================
  console.log("\n🔗 Creating family relationships...");

  let relationshipCount = 0;

  for (const node of familyTreeData) {
    try {
      // Create spouse relationships
      if (node.rels?.spouses) {
        for (const spouseId of node.rels.spouses) {
          // Check if both nodes exist
          const node1 = await prisma.familyTreeNode.findUnique({
            where: { id: node.id },
          });
          const node2 = await prisma.familyTreeNode.findUnique({
            where: { id: spouseId },
          });

          if (node1 && node2) {
            await prisma.familyRelationship.upsert({
              where: {
                person1Id_person2Id_relationshipType: {
                  person1Id: node.id,
                  person2Id: spouseId,
                  relationshipType: "SPOUSE",
                },
              },
              update: {},
              create: {
                person1Id: node.id,
                person2Id: spouseId,
                relationshipType: "SPOUSE",
              },
            });
            relationshipCount++;
          }
        }
      }

      // Create parent-child relationships
      if (node.rels?.father) {
        const fatherNode = await prisma.familyTreeNode.findUnique({
          where: { id: node.rels.father },
        });
        const childNode = await prisma.familyTreeNode.findUnique({
          where: { id: node.id },
        });

        if (fatherNode && childNode) {
          await prisma.familyRelationship.upsert({
            where: {
              person1Id_person2Id_relationshipType: {
                person1Id: node.rels.father,
                person2Id: node.id,
                relationshipType: "CHILD",
              },
            },
            update: {},
            create: {
              person1Id: node.rels.father,
              person2Id: node.id,
              relationshipType: "CHILD",
            },
          });
          relationshipCount++;
        }
      }

      if (node.rels?.mother) {
        const motherNode = await prisma.familyTreeNode.findUnique({
          where: { id: node.rels.mother },
        });
        const childNode = await prisma.familyTreeNode.findUnique({
          where: { id: node.id },
        });

        if (motherNode && childNode) {
          await prisma.familyRelationship.upsert({
            where: {
              person1Id_person2Id_relationshipType: {
                person1Id: node.rels.mother,
                person2Id: node.id,
                relationshipType: "CHILD",
              },
            },
            update: {},
            create: {
              person1Id: node.rels.mother,
              person2Id: node.id,
              relationshipType: "CHILD",
            },
          });
          relationshipCount++;
        }
      }
    } catch (error) {
      // Skip relationship errors silently
    }
  }

  console.log(`✅ Created ${relationshipCount} family relationships\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("=" .repeat(50));
  console.log("🎉 DATABASE SEED COMPLETED!");
  console.log("=" .repeat(50));
  console.log("\n📊 Summary:");
  console.log(`   • Admin User: ${adminUser.email}`);
  console.log(`   • Password: admin123`);
  console.log(`   • Family: ${family.name}`);
  console.log(`   • Family ID: ${family.id}`);
  console.log(`   • Invite Code: ${family.inviteCode}`);
  console.log(`   • Tree Nodes: ${createdCount}`);
  console.log(`   • Relationships: ${relationshipCount}`);
  console.log("\n🚀 You can now:");
  console.log(`   1. Login with: admin@firstfamily.com / admin123`);
  console.log(`   2. View tree at: http://localhost:3000/tree`);
  console.log(`   3. Invite members by clicking on tree nodes`);
  console.log(`   4. Open Prisma Studio: npx prisma studio`);
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Error during seed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
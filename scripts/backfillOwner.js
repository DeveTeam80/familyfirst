// scripts/backfillOwner.js
// Run: node scripts/backfillOwner.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Finding families with null ownerId...");
  const families = await prisma.family.findMany({
    where: { ownerId: null },
    select: { id: true, createdBy: true }
  });

  console.log(`Found ${families.length} families to backfill.`);
  for (const f of families) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1) Set ownerId on family
        await tx.family.update({
          where: { id: f.id },
          data: { ownerId: f.createdBy },
        });

        // 2) Ensure FamilyMember exists for createdBy; if not, create with OWNER role
        const existing = await tx.familyMember.findUnique({
          where: { userId_familyId: { userId: f.createdBy, familyId: f.id } },
        });

        if (!existing) {
          await tx.familyMember.create({
            data: {
              userId: f.createdBy,
              familyId: f.id,
              role: 'OWNER',
              status: 'ACTIVE'
            }
          });
          console.log(`Created OWNER membership for user ${f.createdBy} in family ${f.id}`);
        } else if (existing.role !== 'OWNER') {
          await tx.familyMember.update({
            where: { userId_familyId: { userId: f.createdBy, familyId: f.id } },
            data: { role: 'OWNER' },
          });
          console.log(`Promoted existing member ${f.createdBy} to OWNER for family ${f.id}`);
        } else {
          console.log(`Family ${f.id} already consistent.`);
        }
      });
    } catch (err) {
      console.error(`Failed to backfill family ${f.id}:`, err);
    }
  }

  console.log("Done.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

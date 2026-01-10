import { PrismaClient, FamilyRole, MemberStatus, RelationshipType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// --- CONFIG ---
const OWNER_EMAIL = "maxbrutin@gmail.com";
const OWNER_ID_SLUG = "keith_isaac"; // The ID of the owner in the CSVs
const FAMILY_NAME = "First Family";
const PASSWORD = "password123";

async function main() {
  console.log('☢️  STARTING FULL RESTORE...');

  // 1. Setup Owner & Family
  // ---------------------------------------------------------
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  
  // Clean up existing if needed (Optional, careful in prod)
  await prisma.familyRelationship.deleteMany();
  await prisma.familyTreeNode.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.family.deleteMany();
  await prisma.user.deleteMany({ where: { email: OWNER_EMAIL } });

  const user = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: {
      email: OWNER_EMAIL,
      name: "Keith Isaac",
      username: "keithisaac",
      passwordHash,
      emailVerified: new Date(),
      isOnline: true,
    }
  });
  console.log(`✅ User Ready: ${user.email}`);

  const family = await prisma.family.create({
    data: {
      name: FAMILY_NAME,
      inviteCode: "RESTORE2026",
      createdBy: user.id,
      ownerId: user.id,
    }
  });
  console.log(`✅ Created Family: ${family.id}`);

  await prisma.familyMember.create({
    data: { userId: user.id, familyId: family.id, role: FamilyRole.OWNER, status: MemberStatus.ACTIVE }
  });


  // 2. Read BOTH CSV Files
  // ---------------------------------------------------------
  const nodesPath = path.join(process.cwd(), 'family_tree_nodes.csv');
  const relsPath = path.join(process.cwd(), 'family_relationships.csv');

  let nodeRecords: any[] = [];
  let relRecords: any[] = [];

  try {
    if (fs.existsSync(nodesPath)) {
      nodeRecords = parse(fs.readFileSync(nodesPath, 'utf-8'), { columns: true, skip_empty_lines: true });
      console.log(`📖 Loaded ${nodeRecords.length} node records.`);
    } else {
      console.warn("⚠️ family_tree_nodes.csv not found! Nodes will be inferred from relationships.");
    }

    relRecords = parse(fs.readFileSync(relsPath, 'utf-8'), { columns: true, skip_empty_lines: true });
    console.log(`📖 Loaded ${relRecords.length} relationship records.`);
  } catch (err) {
    console.error("❌ Error reading CSVs:", err);
    process.exit(1);
  }


  // 3. Create Nodes (Merging Data)
  // ---------------------------------------------------------
  const idMap = new Map<string, string>(); // Maps CSV_ID -> DB_UUID
  const processedSlugs = new Set<string>();

  // Helper to normalize strings
  const clean = (s: any) => (s ? String(s).trim() : null);

  // A. Create from Nodes CSV first (Rich Data)
  for (const row of nodeRecords) {
    const slug = row.id; // Original CSV ID (e.g. "keith_isaac")
    if (!slug) continue;

    // Parse specific fields based on your CSV columns
    // Adjust these column names to match your file exactly!
    const firstName = clean(row.first_name) || clean(row.firstName) || slug.split('_')[0];
    const lastName = clean(row.last_name) || clean(row.lastName) || slug.split('_')[1] || "";
    const gender = clean(row.gender) === 'F' || clean(row.gender) === 'Female' ? 'F' : 'M';
    
    // Parse Date (Handle various formats if needed)
    let birthDate = null;
    if (row.birth_date || row.birthday) {
      try { birthDate = new Date(row.birth_date || row.birthday); } catch {}
    }

    const node = await prisma.familyTreeNode.create({
      data: {
        familyId: family.id,
        firstName,
        lastName,
        gender,
        birthDate: birthDate && !isNaN(birthDate.getTime()) ? birthDate : null,
        photoUrl: clean(row.photo_url) || clean(row.avatarUrl) || null,
        bio: clean(row.bio) || null,
        createdBy: user.id,
      }
    });

    idMap.set(slug, node.id);
    processedSlugs.add(slug);
  }

  // B. Create Missing Nodes from Relationships CSV (Fallback)
  const allSlugsInRels = new Set<string>();
  relRecords.forEach((r: any) => {
    if (r.person1_id) allSlugsInRels.add(r.person1_id);
    if (r.person2_id) allSlugsInRels.add(r.person2_id);
  });

  for (const slug of allSlugsInRels) {
    if (!processedSlugs.has(slug)) {
      // Inferred Node
      const nameParts = slug.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1));
      
      // Heuristic Gender
      let gender = 'M';
      const fName = nameParts[0].toLowerCase();
      if (['dorris','audrey','yvonne','sandra','lynn','june','joyce','sharon','patsy','carmen','janet','natalie','yolen','ena','steffie','jennifer','candice','janice','lynette','christine','virginia','fauna','gail'].includes(fName)) {
        gender = 'F';
      }

      const node = await prisma.familyTreeNode.create({
        data: {
          familyId: family.id,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' '),
          gender,
          createdBy: user.id,
        }
      });

      idMap.set(slug, node.id);
      processedSlugs.add(slug);
    }
  }
  console.log(`✅ All ${idMap.size} nodes created.`);


  // 4. Create Relationships
  // ---------------------------------------------------------
  let relCount = 0;
  for (const row of relRecords) {
    const p1 = idMap.get(row.person1_id);
    const p2 = idMap.get(row.person2_id);
    
    // Convert string type to Enum
    let type: RelationshipType = RelationshipType.PARENT; 
    if (row.relationship_type === 'CHILD') type = RelationshipType.CHILD;
    if (row.relationship_type === 'SPOUSE') type = RelationshipType.SPOUSE;
    if (row.relationship_type === 'SIBLING') type = RelationshipType.SIBLING;

    if (p1 && p2) {
      // Prevent duplicates
      const exists = await prisma.familyRelationship.findFirst({
        where: { person1Id: p1, person2Id: p2, relationshipType: type }
      });

      if (!exists) {
        await prisma.familyRelationship.create({
          data: {
            person1Id: p1,
            person2Id: p2,
            relationshipType: type
          }
        });
        relCount++;
      }
    }
  }
  console.log(`✅ Created ${relCount} relationships.`);


  // 5. Link Owner Account
  // ---------------------------------------------------------
  const ownerNodeId = idMap.get(OWNER_ID_SLUG);
  if (ownerNodeId) {
    await prisma.familyTreeNode.update({
      where: { id: ownerNodeId },
      data: { 
        userId: user.id, 
        isAccountHolder: true,
        photoUrl: user.avatarUrl || undefined // Sync avatar if available
      }
    });
    console.log(`🔗 Linked User Account to Tree Node: ${OWNER_ID_SLUG}`);
  } else {
    console.warn(`⚠️ Could not find owner node "${OWNER_ID_SLUG}" to link!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
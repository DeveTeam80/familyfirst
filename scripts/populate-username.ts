// scripts/populate-usernames.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")          // your existing pattern: remove spaces
    .replace(/[^a-z0-9\-_\.]/g, ""); // keep only safe chars (adjust as needed)
}

async function makeUnique(base: string) {
  let candidate = base;
  let suffix = 1;
  while (true) {
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    candidate = `${base}${suffix}`; // e.g., natalieissac1, natalieissac2...
    suffix++;
  }
}

async function main() {
  const users = await prisma.user.findMany({
    where: { username: null },
  });

  console.log(`Found ${users.length} users without username`);

  for (const u of users) {
    const base = slugify(u.name || (u.email?.split("@")[0] ?? `user${u.id.slice(0,6)}`));
    const unique = await makeUnique(base);
    await prisma.user.update({
      where: { id: u.id },
      data: { username: unique },
    });
    console.log(`Updated ${u.id} -> ${unique}`);
  }

  console.log("Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());

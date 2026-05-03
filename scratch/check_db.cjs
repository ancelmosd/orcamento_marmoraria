const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.appointments.findMany();
  console.log("Total appointments:", apps.length);
  console.log(JSON.stringify(apps, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

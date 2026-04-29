import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const photos = await prisma.quote_photos.findMany();
  console.log(photos.map(p => ({ id: p.id, quote_id: p.quote_id, url_length: p.url?.length, desc: p.description })));
}
main().finally(() => prisma.$disconnect());

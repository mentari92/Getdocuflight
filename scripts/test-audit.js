const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const predictions = await prisma.prediction.findMany({
    where: { hasDocumentAnalysis: true },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  if (predictions.length > 0) {
    console.log(JSON.stringify(predictions[0].auditedDocuments, null, 2));
  } else {
    console.log("No predictions with document analysis found.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

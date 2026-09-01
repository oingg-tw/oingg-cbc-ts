/**
 * 一次性把本機開發 DB 同步到 prod（兩個完全獨立的 Neon 專案）。跟 oingg-tpex-ts 的
 * src/scripts/syncDevToProd.ts 是同一套模式：用現有的 Prisma/@prisma/adapter-pg 依賴直接讀 dev、
 * 批次 INSERT ... ON CONFLICT 寫進 prod，不用 pg_dump/psql。
 *
 * Dev 端沿用 shared/config 讀到的 DATABASE_URL（本機 .env）。Prod 端連線字串刻意不從任何檔案讀，
 * 只能用環境變數在呼叫當下傳入，避免帶密碼的字串被寫進 repo 或 shell history 以外的地方留存。
 *
 * company_business_items 靠 tax_id 外鍵回 company_profiles，一定要先同步完 company_profiles，
 * 再同步 company_business_items，否則會撞外鍵約束——這裡沒有自動判斷順序，呼叫端要自己照順序跑。
 *
 * 用法：
 *   PROD_DATABASE_URL="postgresql://...?...&pgbouncer=true" npx tsx src/scripts/syncDevToProd.ts --table=company_profiles
 *   PROD_DATABASE_URL="..." npx tsx src/scripts/syncDevToProd.ts --table=company_business_items
 *   （不加 --yes 只會印出預覽，不會真的寫入）
 *   PROD_DATABASE_URL="..." npx tsx src/scripts/syncDevToProd.ts --table=company_profiles --yes
 */
import 'dotenv/config'; // 獨立腳本，不經過 src/index.ts 的開機流程，要自己先載入 .env
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import devDb from '@/adapters/prisma/index';

const BATCH_SIZE = 500;

interface TableSyncConfig {
  count: () => Promise<number>;
  findBatch: (cursor: unknown) => Promise<Record<string, unknown>[]>;
  nextCursor: (row: Record<string, unknown>) => unknown;
  upsertSql: (batchValues: Prisma.Sql) => Prisma.Sql;
  rowToValues: (row: Record<string, unknown>) => Prisma.Sql;
}

const TABLES: Record<string, TableSyncConfig> = {
  company_profiles: {
    count: () => devDb.companyProfile.count(),
    findBatch: (cursor) =>
      devDb.companyProfile.findMany({
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { taxId: cursor as string } } : {}),
        orderBy: { taxId: 'asc' },
      }),
    nextCursor: (row) => row.taxId,
    rowToValues: (row) => Prisma.sql`(
      ${row.taxId}, ${row.stockCode}, ${row.companyName}, ${row.companyStatus},
      ${row.companyStatusDesc}, ${row.companySetupDate}, ${row.createdAt}::timestamp, ${row.updatedAt}::timestamp
    )`,
    upsertSql: (values) => Prisma.sql`
      INSERT INTO "company_profiles"
        ("tax_id", "stock_code", "company_name", "company_status", "company_status_desc", "company_setup_date", "created_at", "updated_at")
      VALUES ${values}
      ON CONFLICT ("tax_id") DO UPDATE SET
        "stock_code" = EXCLUDED."stock_code",
        "company_name" = EXCLUDED."company_name",
        "company_status" = EXCLUDED."company_status",
        "company_status_desc" = EXCLUDED."company_status_desc",
        "company_setup_date" = EXCLUDED."company_setup_date",
        "updated_at" = EXCLUDED."updated_at"
    `,
  },
  company_business_items: {
    count: () => devDb.companyBusinessItem.count(),
    findBatch: (cursor) =>
      devDb.companyBusinessItem.findMany({
        take: BATCH_SIZE,
        ...(cursor
          ? { skip: 1, cursor: { taxId_position: cursor as { taxId: string; position: number } } }
          : {}),
        orderBy: [{ taxId: 'asc' }, { position: 'asc' }],
      }),
    nextCursor: (row) => ({ taxId: row.taxId, position: row.position }),
    rowToValues: (row) => Prisma.sql`(
      ${row.taxId}, ${row.position}, ${row.seqNo}, ${row.itemCode}, ${row.itemDesc}
    )`,
    upsertSql: (values) => Prisma.sql`
      INSERT INTO "company_business_items" ("tax_id", "position", "seq_no", "item_code", "item_desc")
      VALUES ${values}
      ON CONFLICT ("tax_id", "position") DO UPDATE SET
        "seq_no" = EXCLUDED."seq_no",
        "item_code" = EXCLUDED."item_code",
        "item_desc" = EXCLUDED."item_desc"
    `,
  },
  // company_industry_classifications 靠 tax_id 外鍵回 company_profiles、industry_code 外鍵回
  // tax_industry_classification——後者是靜態字典，用 prisma/seed.ts 灌，不是靠這支腳本同步。
  company_industry_classifications: {
    count: () => devDb.companyIndustryClassification.count(),
    findBatch: (cursor) =>
      devDb.companyIndustryClassification.findMany({
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { taxId: cursor as string } } : {}),
        orderBy: { taxId: 'asc' },
      }),
    nextCursor: (row) => row.taxId,
    rowToValues: (row) => Prisma.sql`(
      ${row.taxId}, ${row.industryCode}, ${row.sourceIndustryName}, ${row.registeredAddress}, ${row.fetchedAt}::timestamp, ${row.updatedAt}::timestamp
    )`,
    upsertSql: (values) => Prisma.sql`
      INSERT INTO "company_industry_classifications"
        ("tax_id", "industry_code", "source_industry_name", "registered_address", "fetched_at", "updated_at")
      VALUES ${values}
      ON CONFLICT ("tax_id") DO UPDATE SET
        "industry_code" = EXCLUDED."industry_code",
        "source_industry_name" = EXCLUDED."source_industry_name",
        "registered_address" = EXCLUDED."registered_address",
        "updated_at" = EXCLUDED."updated_at"
    `,
  },
  monthly_gov_bond_yield_10y: {
    count: () => devDb.monthlyGovBondYield10y.count(),
    findBatch: (cursor) =>
      devDb.monthlyGovBondYield10y.findMany({
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { year_month: cursor as { year: number; month: number } } } : {}),
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
    nextCursor: (row) => ({ year: row.year, month: row.month }),
    rowToValues: (row) => Prisma.sql`(${row.year}, ${row.month}, ${row.yieldRate})`,
    upsertSql: (values) => Prisma.sql`
      INSERT INTO "monthly_gov_bond_yield_10y" ("year", "month", "yield_rate")
      VALUES ${values}
      ON CONFLICT ("year", "month") DO UPDATE SET "yield_rate" = EXCLUDED."yield_rate"
    `,
  },
};

function parseArgs(): Map<string, string> {
  const args = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    if (key) args.set(key, rest.length > 0 ? rest.join('=') : 'true');
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const dryRun = !args.has('yes');
  const tableName = args.get('table');

  if (!tableName || !TABLES[tableName]) {
    console.error(`[sync] --table 必須是 ${Object.keys(TABLES).join(' 或 ')} 其中之一。`);
    process.exit(1);
  }
  const table = TABLES[tableName];

  const prodUrl = process.env.PROD_DATABASE_URL;
  if (!prodUrl) {
    console.error('[sync] 缺少 PROD_DATABASE_URL 環境變數，中止（刻意不讀任何檔案，避免密碼外洩）。');
    process.exit(1);
  }

  const prodAdapter = new PrismaPg({ connectionString: prodUrl });
  const prodDb = new PrismaClient({ adapter: prodAdapter });

  const totalRows = await table.count();
  console.log(`[sync] dev ${tableName} 共 ${totalRows} 筆，每批 ${BATCH_SIZE} 筆。`);

  if (dryRun) {
    console.log('[sync] 這是預覽模式，沒有寫入 prod。確認數量沒問題後加上 --yes 才會真的執行。');
    await devDb.$disconnect();
    await prodDb.$disconnect();
    return;
  }

  let cursor: unknown;
  let processed = 0;

  for (;;) {
    const batch = await table.findBatch(cursor);
    if (batch.length === 0) break;

    const values = Prisma.join(batch.map((row) => table.rowToValues(row)));
    await prodDb.$executeRaw(table.upsertSql(values));

    processed += batch.length;
    const lastRow = batch[batch.length - 1];
    if (!lastRow) break; // 不會發生（上面已經檢查過 batch.length === 0），純粹滿足型別檢查
    cursor = table.nextCursor(lastRow);
    console.log(`[sync] 已同步 ${processed}/${totalRows} 筆`);
  }

  console.log(`[sync] 完成。共同步 ${processed} 筆到 prod。`);
  await devDb.$disconnect();
  await prodDb.$disconnect();
}

main().catch((error) => {
  console.error('[sync] 未預期錯誤:', error);
  process.exit(1);
});

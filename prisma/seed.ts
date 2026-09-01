import 'dotenv/config'; // 獨立腳本執行（tsx prisma/seed.ts），不會經過 src/index.ts 的開機流程，
// 要自己先載入 .env，adapters/prisma/index.ts 在 import 當下就會讀 process.env.DATABASE_URL。
import fs from 'node:fs';
import path from 'node:path';
import prisma from '../src/adapters/prisma/index';

// 一次性 seed script：把財政部《中華民國稅務行業標準分類（第9次修訂）》的完整代碼字典（19大類/
// 88中類/249小類/522細類/1587子類，共 2,466 列——文件自己標的 1587 子類跟實際資料差 1，比對過
// 沒有重複代碼，判斷是文件本身的統計誤植，不是抓取或解析出錯）灌進 tax_industry_classification。
// 資料來源：財政部統計處官方 Excel（system(9th).xlsx，2026-08-31 從 mof.gov.tw 下載），不是向外部
// API 抓的時序資料，所以不走其他 domain 那種 route/controller/service 的 ingest 流程，直接讀本地
// JSON 灌表即可。JSON 本身是從 xlsx 的 sheet XML 直接解析出來的（sharedStrings.xml + sheet1.xml），
// 刻意不走「另存 CSV」這條路——CSV 那份因為某個環節被誤判成 Latin-1 解碼，中文的 UTF-8 位元組只要
// 落在 0x80-0x9F 這個 C1 控制字元區間就會被靜默吃掉，救不回來；xlsx 內部本來就是規規矩矩的 UTF-8
// XML，不會有這個問題。
//
// 只在初次建表或官方改版重新發布時執行一次：
//   pnpm tsx prisma/seed.ts

type SeedRow = {
  code: string;
  level: 'section' | 'division' | 'group' | 'class' | 'subclass';
  sectionCode: string | null;
  divisionCode: string | null;
  groupCode: string | null;
  classCode: string | null;
  subclassCode: string | null;
  nameZh: string | null;
  nameEn: string | null;
};

const CHUNK_SIZE = 500;

async function main() {
  const dataPath = path.join(__dirname, 'seed-data', 'tax-industry-classification.json');
  const rows: SeedRow[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`[seed] loaded ${rows.length} rows from ${path.basename(dataPath)}`);

  const before = await prisma.taxIndustryClassification.count();
  console.log(`[seed] existing rows in table before seeding: ${before}`);

  // 靜態參考資料，重跑就是全部重灌一次（官方改版時），不用逐列 upsert 比對差異。
  await prisma.taxIndustryClassification.deleteMany({});

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await prisma.taxIndustryClassification.createMany({ data: chunk });
    console.log(`[seed] inserted ${Math.min(i + CHUNK_SIZE, rows.length)}/${rows.length}`);
  }

  const after = await prisma.taxIndustryClassification.count();
  const byLevel = await prisma.taxIndustryClassification.groupBy({
    by: ['level'],
    _count: { _all: true },
  });

  console.log(`[seed] done. total rows now in table: ${after}`);
  console.log('[seed] counts by level:', byLevel.map((r) => `${r.level}=${r._count._all}`).join(', '));
}

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

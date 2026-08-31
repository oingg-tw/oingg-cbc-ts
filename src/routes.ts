import { Router } from 'ultimate-express';
import rootRouter from './domains/system/root';
import govBondYield10yRouter from './domains/govBondYield10y/route';
import companyBusinessItemsRouter from './domains/companyBusinessItems/route';
import taxIndustryClassificationRouter from './domains/taxIndustryClassification/route';
import companyProfileIngestRouter from './domains/companyProfile/ingestRoute';
import companyProfileQueryRouter from './domains/companyProfile/queryRoute';
// 每新增一個 domain（例如 exchangeRate、interestRate），在這裡 import 其 route.ts。
// 會寫入資料庫的 ingest 型 domain 掛進 ingestRouter（/api/ingest）；單純即時查詢、不落地的
// query 型 domain（例如 companyBusinessItems、taxIndustryClassification）掛進 queryRouter（/api/query）。
// 像 companyProfile 這種兩邊都有的 domain，拆成 ingestRoute.ts / queryRoute.ts 兩個檔案分別掛。

const router = Router();

// --- System & Root Routes ---
router.use(rootRouter);

// --- API Routes ---
const ingestRouter = Router();
ingestRouter.use(govBondYield10yRouter);
ingestRouter.use(companyProfileIngestRouter);

const queryRouter = Router();
queryRouter.use(companyBusinessItemsRouter);
queryRouter.use(taxIndustryClassificationRouter);
queryRouter.use(companyProfileQueryRouter);

router.use('/api/ingest', ingestRouter);
router.use('/api/query', queryRouter);

export default router;

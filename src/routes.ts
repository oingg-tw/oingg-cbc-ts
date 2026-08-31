import { Router } from 'ultimate-express';
import rootRouter from './domains/system/root';
import govBondYield10yRouter from './domains/govBondYield10y/route';
import companyBusinessItemsRouter from './domains/companyBusinessItems/route';
// 每新增一個 domain（例如 exchangeRate、interestRate），在這裡 import 其 route.ts。
// 會寫入資料庫的 ingest 型 domain 掛進 ingestRouter（/api/ingest）；單純即時查詢、不落地的
// query 型 domain（例如 companyBusinessItems）掛進 queryRouter（/api/query）。

const router = Router();

// --- System & Root Routes ---
router.use(rootRouter);

// --- API Routes ---
const ingestRouter = Router();
ingestRouter.use(govBondYield10yRouter);

const queryRouter = Router();
queryRouter.use(companyBusinessItemsRouter);

router.use('/api/ingest', ingestRouter);
router.use('/api/query', queryRouter);

export default router;

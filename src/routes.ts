import { Router } from 'ultimate-express';
import rootRouter from './domains/system/root';
import govBondYield10yRouter from './domains/govBondYield10y/route';
// 每新增一個 domain（例如 exchangeRate、interestRate），在這裡 import 其 route.ts
// 並掛進 apiRouter，做法比照 oingg-mops-ts 的 src/routes.ts。

const router = Router();

// --- System & Root Routes ---
router.use(rootRouter);

// --- API Routes ---
const apiRouter = Router();
apiRouter.use(govBondYield10yRouter);

router.use('/api/ingest', apiRouter);

export default router;

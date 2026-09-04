import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/shared/config';
import { registry } from '@/adapters/swagger/registry';
// 只為了觸發副作用：每個 domain 的 route.ts 在自己模組頂層呼叫 registry.registerPath()，import
// '@/routes' 會連帶 import 到全部 domain 的 route.ts，讓它們先把自己的端點登記進 registry，這個
// 檔案才有東西可以產生文件。用 import 而不是要求呼叫端先自己 import routes 再 import 這裡——
// module cache 保證 routes 只會真的執行一次，不管誰先 import，這裡自己 import 一次確保正確順序，
// 不用依賴 src/index.ts 裡兩個 import 敘述的先後順序（那種依賴容易在之後改 import 順序時悄悄壞掉）。
import '@/routes';

const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'OINGG Gov API',
    version: '1.0.0',
    description: 'API documentation for the OINGG Taiwan government open data ingestion service',
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
  ],
});

export { swaggerUi };

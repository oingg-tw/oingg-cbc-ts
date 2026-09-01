import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { join } from 'path';
import { config } from '@/shared/config';

// package.json 沒有 "type": "module"，所以 tsconfig 的 module: NodeNext 會把這個檔案編譯成
// CommonJS（不是 ESM）——__dirname 因此是原生可用的全域變數，不能用 import.meta.url（CommonJS
// 輸出下 TS 會直接編譯錯誤：TS1470）。跟 oingg-tpex-ts 的 adapters/swagger/index.ts 同一個道理。

// glob (used internally by swagger-jsdoc) treats `\` as an escape character, so
// Windows-style paths from `join()` silently match zero files there. Normalize to `/`.
const toGlobPath = (...segments: string[]) => join(...segments).split('\\').join('/');

const options: swaggerJSDoc.Options = {
  definition: {
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
    components: {
      securitySchemes: {
        TaskSecret: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Task-Secret',
        },
      },
    },
  },
  // Path to the API docs. It's crucial to use absolute paths created with `join`. Glob matches
  // both .ts and .js: dev runs src/*.ts directly via tsx, but the compiled prod build only has
  // dist/*.js (see Dockerfile) — __dirname itself already shifts correctly between the two
  // (src/adapters/swagger vs dist/adapters/swagger), only the extension needs to cover both.
  apis: [
    toGlobPath(__dirname, '../../domains/**/*.{ts,js}'),
    toGlobPath(__dirname, '../../shared/**/*.{ts,js}'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };

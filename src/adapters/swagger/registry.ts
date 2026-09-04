import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// 讓 zod schema 可以額外掛 .openapi({...}) 附加中繼資料（description/example）——一定要在任何
// route 檔案呼叫 registry.registerPath() 之前執行過，所以放在這個共用檔案的最上層，被任何 route
// 檔案 import 到就會自動跑過。
extendZodWithOpenApi(z);

// 全域唯一的 registry：每個 domain 的 route.ts 在自己的模組頂層呼叫 registry.registerPath()
// 把自己的端點登記進來（副作用 import，見 adapters/swagger/index.ts 的說明）。這裡不用每個 domain
// 各自建一個 registry 再合併，單一共用實例最簡單。
export const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'TaskSecret', {
  type: 'apiKey',
  in: 'header',
  name: 'X-Task-Secret',
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 讓 `describe`/`it`/`expect` 等 API 變成全域變數，測試檔案不用逐一 import。
    globals: true,
    // 明確排除 dist——`pnpm run build` 會把 src/tests/*.test.ts 一併編譯成 dist/tests/*.test.js，
    // 實測發現不排除的話 vitest 會把兩邊都當成測試檔跑，同一批測試跑兩次（本機 build 過一次後
    // 才會發生，CI 從乾淨的 checkout 跑不會踩到，但本機開發很容易忘記，明確排除比較保險）。
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});

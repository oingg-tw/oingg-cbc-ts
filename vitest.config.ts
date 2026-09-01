import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 讓 `describe`/`it`/`expect` 等 API 變成全域變數，測試檔案不用逐一 import。
    globals: true,
  },
});

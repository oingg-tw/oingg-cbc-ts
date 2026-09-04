import { Request, Response, NextFunction } from 'ultimate-express';

// A simple interface for HTTP errors
interface HttpError extends Error {
  status?: number;
}

// _next 有留著但沒用到——Express/ultimate-express 靠 handler 的參數個數（arity）判斷是不是錯誤
// 處理 middleware，一定要維持 4 個參數簽章，否則框架不會把這個函式當成 error handler 呼叫。
const errorHandler = (err: HttpError, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong on the server.';

  // In production, you might not want to send the detailed error message to the client
  res.status(status).send({ status, message });
};

export default errorHandler;

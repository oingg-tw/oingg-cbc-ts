import { Router, type Request, type Response } from 'ultimate-express';
import { z } from 'zod';
import { getStartupTime } from '@/shared/serverInfo';
import { registry } from '@/adapters/swagger/registry';

const router = Router();

registry.registerPath({
  method: 'get',
  path: '/',
  summary: 'Get server status and startup time',
  description: 'Returns a welcome message and the time it took for the server to initialize.',
  tags: ['System'],
  responses: {
    200: {
      description: 'Server status and startup time.',
      content: {
        'application/json': {
          schema: z.object({
            startupTime: z.string().openapi({ example: 'Server startup time: 123.45ms' }),
          }),
        },
      },
    },
  },
});

router.get('/', (req: Request, res: Response) => {
  const startupTime = getStartupTime();
  const startupMessage = startupTime !== null ? `Server startup time: ${startupTime.toFixed(2)}ms` : 'Startup time not yet available.';

  res.json({
    startupTime: startupMessage,
  });
});

export default router;

import { HttpsAgent } from 'agentkeepalive';
import got, { Got } from 'got';
import { Logger } from 'winston';

import { TransportErrorHandler } from './error/TransportError';

export const getTransportClient = (logger: Logger): Got => {
  return got.extend({
    retry: {
      limit: 3,
      methods: ['GET', 'POST', 'PUT'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
      errorCodes: ['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED'],
    },
    agent: {
      https: new HttpsAgent({
        keepAlive: true,
        maxSockets: 50,
      }),
    },
    hooks: {
      beforeRetry: [
        (normOpt, error, count) => {
          if (error && logger.level === 'debug') {
            const { transportError } = new TransportErrorHandler(error, 'retry');
            logger?.warn(
              `Retry: ${count || 'unknown'} -- error -- code: ${transportError.errorCode} / message: ${
                transportError.errorContent
              }`,
            );
          }
        },
      ],
    },
  });
};

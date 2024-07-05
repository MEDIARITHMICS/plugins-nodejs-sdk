import express from 'express';
import winston from 'winston';
import { BatchUpdateContext, BatchUpdatePluginResponse, BatchUpdateRequest } from './BatchUpdateInterface';

export type CallOnBatchUpdate<C extends BatchUpdateContext, T> = (
  request: BatchUpdateRequest<C, T>,
) => Promise<BatchUpdatePluginResponse>;
export type DeserializerT<T> = (obj: string) => T;
export class BatchUpdateHandler<C extends BatchUpdateContext, T> {
  logger: winston.Logger;
  app: express.Application;
  emptyBodyFilter: (req: express.Request, res: express.Response, next: express.NextFunction) => void;

  constructor(
    app: express.Application,
    emptyBodyFilter: (req: express.Request, res: express.Response, next: express.NextFunction) => void,
    logger: winston.Logger,
  ) {
    this.app = app;
    this.emptyBodyFilter = emptyBodyFilter;
    this.logger = logger;
  }

  public registerRoute(onbatchUpdateFn: CallOnBatchUpdate<C, T>): void {
    this.app.post('/v1/batch_update', this.emptyBodyFilter, async (req: express.Request, res: express.Response) => {
      try {
        this.logger.debug(`POST /v1/batch_update ${JSON.stringify(req.body)}`);

        const request = req.body as BatchUpdateRequest<C, T>;

        const response: BatchUpdatePluginResponse = await onbatchUpdateFn(request);

        this.logger.debug(`Returning: ${JSON.stringify(response)}`);

        const pluginResponse: BatchUpdatePluginResponse = {
          status: response.status,
          sent_items_in_success: response.sent_items_in_success,
          sent_items_in_error: response.sent_items_in_error,
        };

        if (response.next_msg_delay_in_ms) {
          res.set('x-mics-next-msg-delay', response.next_msg_delay_in_ms.toString());
        }

        if (response.message) {
          pluginResponse.message = response.message;
        }

        let statusCode: number;
        switch (response.status) {
          case 'OK':
            statusCode = 200;
            break;
          case 'ERROR':
            statusCode = 400;
            break;
          case 'RETRY':
            statusCode = 503;
            break;
          default:
            statusCode = 500;
        }

        return res.status(statusCode).send(JSON.stringify(pluginResponse));
      } catch (err) {
        this.logger.error(
          `Something bad happened : ${(err as Error).message} - ${
            (err as Error).stack ? ((err as Error).stack as string) : 'stack undefined'
          }`,
        );
        return res.status(500).send({ status: 'error', message: `${(err as Error).message}` });
      }
    });
  }
}

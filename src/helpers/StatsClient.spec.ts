/* eslint-disable @typescript-eslint/ban-ts-comment */

import { expect } from 'chai';
import sinon from 'sinon';
import winston from 'winston';

import { MetricsType, StatsClient } from './StatsClient';

describe('statsClient', () => {
  let statsClient: StatsClient;
  const logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
    level: 'debug',
  });

  beforeEach(() => {
    statsClient = StatsClient.init({
      timerInMs: 50,
      logger,
    });
  });

  afterEach(() => {
    // @ts-ignore
    clearInterval(statsClient.interval);
  });

  it('ok', async () => {
    // @ts-ignore
    const spyFnIncr = sinon.spy(statsClient.client, 'increment');
    // @ts-ignore
    const spyFnGauge = sinon.spy(statsClient.client, 'gauge');

    statsClient.addOrUpdateMetrics({
      metrics: {
        processed_users: { type: MetricsType.INCREMENT, value: 4, tags: { datamart_id: '4521' } },
        users_with_mobile_id_count: { type: MetricsType.GAUGE, value: 1, tags: { datamart_id: '4521' } },
      },
    });

    expect(spyFnIncr.callCount).to.be.eq(1);
    expect(spyFnIncr.getCall(0).args).to.be.eqls(['processed_users', 4, { datamart_id: '4521' }]);

    expect(spyFnGauge.callCount).to.be.eq(1);
    expect(spyFnGauge.getCall(0).args).to.be.eqls(['users_with_mobile_id_count', 1, { datamart_id: '4521' }]);

    statsClient.addOrUpdateMetrics({
      metrics: {
        processed_users: { type: MetricsType.INCREMENT, value: 2, tags: { datamart_id: '4521' } },
        users_with_mobile_id_count: { type: MetricsType.GAUGE, value: 1, tags: { datamart_id: '4521' } },
      },
    });

    statsClient.addOrUpdateMetrics({
      metrics: { apiCallsError: { type: MetricsType.INCREMENT, value: 3, tags: { statusCode: '500' } } },
    });

    expect(spyFnIncr.callCount).to.be.eq(3);
    expect(spyFnIncr.getCall(1).args).to.be.eqls(['processed_users', 2, { datamart_id: '4521' }]);
    expect(spyFnIncr.getCall(2).args).to.be.eqls(['apiCallsError', 3, { statusCode: '500' }]);

    expect(spyFnGauge.callCount).to.be.eq(2);
    expect(spyFnGauge.getCall(1).args).to.be.eqls(['users_with_mobile_id_count', 1, { datamart_id: '4521' }]);
  });
});

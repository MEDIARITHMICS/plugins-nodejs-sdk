import { StatsD, Tags } from 'hot-shots';

import winston = require('winston');

export enum MetricsType {
  GAUGE = 'gauge',
  INCREMENT = 'increment',
}

export interface InitOptions {
  /**
   * interval to send stats to datadog in ms (default = 15 seconds)
   */
  timerInMs?: number;

  /**
   * Used to init or not the stats client.
   * When running production, NODE_ENV should be "production".
   * If running tests, NODE_ENV should be "development".
   */
  environment?: string;

  /**
   * An optional logger to send Metrics into logs (in debug mode)
   */
  logger?: winston.Logger;

  /**
   *  If larger than 0, metrics will be buffered and only sent
   *  when the string length is greater than the size. (default = 8192)
   */
  maxBufferSize?: number;
}

export interface AddOrUpdateMetricsOptions {
  /**
   * @example
   * ```
   * declare your metrics, their types, value and optionals tags.
   * {metrics: {processed_users: { type: MetricsType.GAUGE, value: 4, tags: {datamart_id: '4521'}}, users_with_mobile_id_count: {type: MetricsType.INCREMENT, value: 1, tags: {datamart_id: '4521'}}}}
   * {processed_users: 4}
   */
  metrics: {
    [metricName: string]: MetricOptions;
  };
}

export interface MetricOptions {
  type: MetricsType;
  value: number;
  tags?: Tags;
}

export type MetricsSet = Map<string, MetricsOptionsWithName>;

export interface MetricsOptionsWithName extends MetricOptions {
  metricName: string;
}

/**
 * Send stats to datadog
 */
export class StatsClient {
  private static instance: StatsClient;
  private client: StatsD;

  private constructor(timerInMs: number, maxBufferSize: number, environment: string | undefined) {
    this.client = new StatsD({
      protocol: environment === 'production' ? 'uds' : undefined,
      maxBufferSize: maxBufferSize,
      bufferFlushInterval: timerInMs,
    });
  }

  /**
   * @example
   * ```
   * private this.statsClient: StatsClient
   * constructor() {
   *   this.statsClient = StatsClient.init({ environment: process.env.NODE_ENV });
   * }
   * ```
   */
  static init({ timerInMs , environment = process.env.NODE_ENV, logger, maxBufferSize }: InitOptions): StatsClient {
    const actualTimerInMs = timerInMs ? timerInMs : 15 * 1000;
    const actualMaxBufferSize = maxBufferSize ? maxBufferSize : 8192;
    logger?.info(
      `StatsClient - environment is ${
        environment ? environment : 'undefined'
      } mode - Timer is ${actualTimerInMs} - 
      maxBufferSize is ${actualMaxBufferSize} - Initialization.`,
    );
    return this.instance || (this.instance = new StatsClient(actualTimerInMs, actualMaxBufferSize, environment));
  }

  /**
   * Increment some metrics
   * @example
   * ```
   * this.statClient.addOrUpdateMetrics({metrics: {processed_users: { type: MetricsType.GAUGE, value: 4, tags: {datamart_id: '4521'}}, users_with_mobile_id_count: {type: MetricsType.INCREMENT, value: 1, tags: {datamart_id: '4521'}}}})
   * this.statClient.addOrUpdateMetrics({metrics: {apiCallsError: { type: MetricsType.GAUGE, value: 10, tags: {statusCode: '500'}}}})
   * ```
   */
  public addOrUpdateMetrics({ metrics }: AddOrUpdateMetricsOptions): void {
    Object.entries(metrics).forEach(([metricName, options]) => {
      if (options.type === MetricsType.GAUGE) {
        this.client.gauge(metricName, options.value, { ...options.tags });
      } else {
        this.client.increment(metricName, options.value, { ...options.tags });
      }
    });
  }
}

import * as express from 'express';
import * as _ from 'lodash';
import {BasePlugin, BasePluginProps, PropertiesWrapper} from '../common';
import {BidOptimizer} from '../../api/core/bidoptimizer/BidOptimizerInterface';
import {BidOptimizerRequest, SaleCondition} from '../../api/plugin/bidoptimizer/BidOptimizerRequestInterface';
import {BidDecision} from '../../api/plugin/bidoptimizer/BidDecision';

export type BidOptimizerPluginResponse = BidDecision;

export interface BidOptimizerBaseInstanceContext {
  properties: PropertiesWrapper;
  bidOptimizer: BidOptimizer;
}

export abstract class BidOptimizerPlugin extends BasePlugin {
  instanceContext: Promise<BidOptimizerBaseInstanceContext>;

  constructor(props?: BasePluginProps) {
    super(props);
    this.initBidDecisions();
    this.setErrorHandler();
  }

  findBestSalesConditions(
    bidPrice: number,
    salesConditions: SaleCondition[]
  ): SaleCondition {
    // Optimization, we only do the stringify  if we are really on debug / silly mode
    if (this.logger.level === 'debug' || this.logger.level === 'silly') {
      this.logger.debug(
        `Looking to find the best sale condition for CPM: ${
          bidPrice
        } in: ${JSON.stringify(salesConditions, null, 4)}`
      );
    }
    const eligibleSalesConditions = salesConditions.filter(sc => {
      return sc.floor_price <= bidPrice;
    });
    // Optimization, we only do the stringify  if we are really on debug / silly mode
    if (this.logger.level === 'debug' || this.logger.level === 'silly') {
      this.logger.debug(
        `Found eligible sales condition for CPM: ${
          bidPrice
        } in: ${JSON.stringify(eligibleSalesConditions, null, 4)}`
      );
    }
    const sortedEligibleSalesConditions = eligibleSalesConditions.sort(
      (a, b) => {
        return a.floor_price - b.floor_price;
      }
    );
    // Optimization, we only do the stringify  if we are really on debug / silly mode
    if (this.logger.level === 'debug' || this.logger.level === 'silly') {
      this.logger.debug(
        `Sorted eligible sales condition for CPM: ${
          bidPrice
        } in: ${JSON.stringify(sortedEligibleSalesConditions, null, 4)}`
      );
    }

    return sortedEligibleSalesConditions[0];
  }

  /**
   * Method to build an instance context
   * To be overriden to get a cutom behavior
   * This is a default provided implementation
   * @param bidOptimizerId
   */
  protected async instanceContextBuilder(
    bidOptimizerId: string
  ): Promise<BidOptimizerBaseInstanceContext> {
    const bidOptimizerP = this.gatewaySdk.fetchBidOptimizer(bidOptimizerId);
    const bidOptimizerPropsP = this.gatewaySdk.fetchBidOptimizerProperties(bidOptimizerId);

    const results = await Promise.all([bidOptimizerP, bidOptimizerPropsP]);

    const bidOptimizer = results[0];
    const bidOptimizerProps = results[1];

    const context = {
      bidOptimizer: bidOptimizer,
      properties: new PropertiesWrapper(bidOptimizerProps)
    };

    return context;
  }

  /**
   *
   * @param request
   * @param instanceContext
   */
  protected abstract onBidDecisions(
    request: BidOptimizerRequest,
    instanceContext: BidOptimizerBaseInstanceContext
  ): Promise<BidOptimizerPluginResponse>;

  private initBidDecisions(): void {
    this.app.post(
      '/v1/bid_decisions',
      this.asyncMiddleware(
        async (req: express.Request, res: express.Response) => {
          if (!req.body || _.isEmpty(req.body)) {
            const msg = {
              error: 'Missing request body'
            };
            this.logger.error(
              'POST /v1/bid_decisions : %s',
              JSON.stringify(msg)
            );
            return res.status(500).json(msg);
          } else {
            if (
              this.logger.level === 'debug' ||
              this.logger.level === 'silly'
            ) {
              this.logger.debug(
                `POST /v1/bid_decisions ${JSON.stringify(req.body)}`
              );
            }

            const bidOptimizerRequest = req.body as BidOptimizerRequest;

            if (!this.onBidDecisions) {
              const errMsg = 'No BidOptimizer listener registered!';
              this.logger.error(errMsg);
              return res.status(500).json({error: errMsg});
            }

            if (
              !this.pluginCache.get(
                bidOptimizerRequest.campaign_info.bid_optimizer_id
              )
            ) {
              this.pluginCache.put(
                bidOptimizerRequest.campaign_info.bid_optimizer_id,
                this.instanceContextBuilder(
                  bidOptimizerRequest.campaign_info.bid_optimizer_id
                ),
                this.getInstanceContextCacheExpiration()
              );
            } // We init the specific route to listen for bid decisions requests

            const instanceContext = await this.pluginCache.get(
              bidOptimizerRequest.campaign_info.bid_optimizer_id
            );

            const bidOptimizerResponse = await this.onBidDecisions(
              bidOptimizerRequest,
              instanceContext
            );

            if (
              this.logger.level === 'debug' ||
              this.logger.level === 'silly'
            ) {
              this.logger.debug(
                `Returning: ${JSON.stringify(bidOptimizerResponse)}`
              );
            }

            return res.status(200).send(JSON.stringify(bidOptimizerResponse));
          }
        }
      )
    );
  }
}

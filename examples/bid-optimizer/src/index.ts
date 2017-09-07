import { core } from "@mediarithmics/plugins-nodejs-sdk";

export class MyBidOptimizerPlugin extends core.BidOptimizerPlugin {
  protected onBidDecisions (
    request: core.BidOptimizerRequest,
    instanceContext: core.BidOptimizerBaseInstanceContext
  ): Promise<core.BidOptimizerPluginResponse> {

    this.logger.debug(`Received ibnside plugin: ${JSON.stringify(request, null, 4)}`);
    const response: core.BidOptimizerPluginResponse = {
      bids: [{
        index: 0,
        bidPrice: request.campaign_info.max_bid_price,
        saleConditionId: request.bid_info.placements[0].sales_conditions[0].id
      }]
    };

    return Promise.resolve(response);
  }
}

// All the magic is here
const plugin = new MyBidOptimizerPlugin();
const runner = new core.ProductionPluginRunner(plugin);
runner.start();
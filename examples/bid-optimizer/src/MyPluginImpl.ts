import { core } from "@mediarithmics/plugins-nodejs-sdk";

export class MyBidOptimizerPlugin extends core.BidOptimizerPlugin {
  protected onBidDecisions(
    request: core.BidOptimizerRequest,
    instanceContext: core.BidOptimizerBaseInstanceContext
  ): Promise<core.BidOptimizerPluginResponse> {
    this.logger.debug(
      `Received inside plugin: ${JSON.stringify(request, null, 4)}`
    );

    const bids: core.Bid[] = request.bid_info.placements.map((
      placementInfo,
      index
    ) => {
      return {
        index: index,
        bidPrice: request.campaign_info.max_bid_price,
        saleConditionId: this.findBestSalesConditions(request.campaign_info.max_bid_price, placementInfo.sales_conditions).id
      };
    });

    const response: core.BidOptimizerPluginResponse = {
      bids: bids
    };

    return Promise.resolve(response);
  }
}

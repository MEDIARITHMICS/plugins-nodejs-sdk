import 'mocha';

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';

import { core } from '@mediarithmics/plugins-nodejs-sdk';

import { MyBidOptimizerPlugin } from '../MyPluginImpl';

const PLUGIN_AUTHENTICATION_TOKEN = 'Manny';
const PLUGIN_WORKER_ID = 'Calavera';

// set by the plugin runner in production
process.env.PLUGIN_AUTHENTICATION_TOKEN = PLUGIN_AUTHENTICATION_TOKEN;
process.env.PLUGIN_WORKER_ID = PLUGIN_WORKER_ID;

describe('Test Example BidOptimizer', function () {
  // We stub the Gateway calls
  const rpMockup: sinon.SinonStub = sinon.stub();

  // Activity Analyzer stub
  const bidOptimizer: core.DataResponse<core.BidOptimizer> = {
    status: 'ok',
    data: {
      id: '1000',
      name: 'my analyzer',
      organisation_id: '1000',
      engine_version_id: '123456',
      engine_group_id: 'com.mediarithmics.visit-analyzer',
      engine_artifact_id: 'default',
    },
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        'url',
        sinon.match(function (value: string) {
          return value.match(/\/v1\/bid_optimizers\/(.){1,10}/) !== null;
        }),
      ),
    )
    .returns(bidOptimizer);

  // Activity Analyzer properties stub
  const bidOptimizerProperties: core.PluginPropertyResponse = {
    count: 1,
    data: [
      {
        technical_name: 'name',
        value: {
          value: 'my bid optimizer',
        },
        property_type: 'STRING',
        origin: 'PLUGIN',
        writable: true,
        deletable: true,
      },
    ],
    status: 'ok',
  };

  rpMockup
    .withArgs(
      sinon.match.has(
        'url',
        sinon.match(function (value: string) {
          return value.match(/\/v1\/bid_optimizers\/(.){1,10}\/properties/) !== null;
        }),
      ),
    )
    .returns(bidOptimizerProperties);

  const bidDecisionRequest: core.BidOptimizerRequest = JSON.parse(`
        {
            "bid_info":{
               "media_type":"WEB",
               "ad_ex_id":"goo",
               "display_network_id":"1014",
               "media_id":"site:web:9gag.com",
               "content_id":"unknown",
               "geo_info":{
                  "geo_name_id":2972315,
                  "iso_country":"FR",
                  "admin1":"B3",
                  "admin2":"31",
                  "postal_code":"31000",
                  "point_name":"Toulouse",
                  "latitude":48.5735,
                  "longitude":7.7559
               },
               "placements":[
                  {
                     "placement_id":"plt:goo:c3bd9d8b",
                     "format":"300x250",
                     "visibility":"ABOVE_THE_FOLD",
                     "viewability":[
                        "goo:10"
                     ],
                     "sales_conditions":[
                        {
                           "id":"4147",
                           "deal_id":null,
                           "floor_price":0.1899999976158142
                        }
                     ],
                     "creative_id":"2445"
                  },
                  {
                     "placement_id":"plt:goo:c3bd9d8b",
                     "format":"300x250",
                     "visibility":"ABOVE_THE_FOLD",
                     "viewability":[
                        "goo:10"
                     ],
                     "sales_conditions":[
                        {
                           "id":"4148",
                           "deal_id":null,
                           "floor_price":0.1899999976158142
                        }
                     ],
                     "creative_id":"1963"
                  }
               ]
            },
            "campaign_info":{
               "organisation_id":"1042",
               "campaign_id":"1231",
               "ad_group_id":"1246",
               "currency":"EUR",
               "date":"2016-11-15T17:01:43.625+01:00",
               "max_bid_price":0.5099999904632568,
               "bid_optimizer_id":"37",
               "objective_type":"CPA",
               "objective_value":1.0,
               "imp_count":null,
               "avg_win_rate":null,
               "avg_bid_price":null,
               "avg_winning_price":null,
               "avg_delivery_price":null
            },
            "user_info":{
               "global_first_view":null,
               "media_first_view":null,
               "user_agent_info":{
                  "form_factor":"PERSONAL_COMPUTER",
                  "os_family":"WINDOWS",
                  "browser_family":"IE",
                  "brand":null,
                  "model":null,
                  "os_version":null,
                  "carrier":null
               }
            },
            "user_campaign_data_bag":null,
            "data_feeds":[

            ]
         }`);

  it('Check behavior of dummy bid optimizer', async function () {
    // All the magic is here
    const plugin = new MyBidOptimizerPlugin(false);
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // Plugin log level to debug
    const res1 = await request(runner.plugin.app).put('/v1/log_level').send({ level: 'debug' });
    expect(res1.status).to.equal(200);

    const res2 = await request(runner.plugin.app).post('/v1/bid_decisions').send(bidDecisionRequest);
    expect(res2.status).to.eq(200);
    expect((JSON.parse(res2.text) as core.BidOptimizerPluginResponse).bids[0].bid_price).to.be.eq(
      bidDecisionRequest.campaign_info.max_bid_price,
    );
  });
});

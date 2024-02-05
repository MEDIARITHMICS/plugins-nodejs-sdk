/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */

import 'mocha';

import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';

import { core } from '../';
import { PropertiesWrapper } from '../mediarithmics';
import { generateEncodedClickUrl } from '../mediarithmics/plugins/ad-renderer/utils/index';

const PLUGIN_AUTHENTICATION_TOKEN = 'Manny';
const PLUGIN_WORKER_ID = 'Calavera';

// set by the plugin runner in production
process.env.PLUGIN_AUTHENTICATION_TOKEN = PLUGIN_AUTHENTICATION_TOKEN;
process.env.PLUGIN_WORKER_ID = PLUGIN_WORKER_ID;

describe('Fetch DisplayAd API', () => {
  const requestPromiseProx: sinon.SinonStub = sinon.stub().returns(Promise.resolve('Yolo'));

  class MyFakeAdRenderer extends core.AdRendererBasePlugin<core.AdRendererBaseInstanceContext> {
    protected async onAdContents(request: core.AdRendererRequest, instanceContext: core.AdRendererBaseInstanceContext) {
      const result: core.AdRendererPluginResponse = {
        html: `All your HTML is belong to us.`,
      };

      return Promise.resolve(result);
    }
  }

  //All the magic is here
  const plugin = new MyFakeAdRenderer(false);
  const runner = new core.TestingPluginRunner(plugin, requestPromiseProx);

  it('Check that creativeId is passed correctly in fetchDisplayAd', async function () {
    const fakeCreativeId = '422';

    // Creative stub
    const creative: core.DataResponse<core.DisplayAd> = {
      status: 'ok',
      data: {
        type: 'DISPLAY_AD',
        id: '422',
        organisation_id: '1126',
        name: 'Toto',
        technical_name: 'hello',
        archived: false,
        editor_version_id: '5',
        editor_version_value: '1.0.0',
        editor_group_id: 'com.mediarithmics.creative.display',
        editor_artifact_id: 'default-editor',
        editor_plugin_id: '5',
        renderer_version_id: '1054',
        renderer_version_value: '1.0.0',
        renderer_group_id: 'com.trololo.creative.display',
        renderer_artifact_id: 'multi-advertisers-display-ad-renderer',
        renderer_plugin_id: '1041',
        creation_date: 1492785056278,
        subtype: 'BANNER',
        format: '300x250',
      },
    };

    requestPromiseProx.withArgs(sinon.match.has('url', sinon.match(/\/v1\/creatives\/(.){1,10}$/))).returns(creative);

    // We try a call to the Gateway
    await plugin.fetchDisplayAd(fakeCreativeId).then(() => {
      expect(requestPromiseProx.args[0][0].url).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/creatives/${fakeCreativeId}`,
      );
    });
  });

  it('Check that fakeCreativeId is passed correctly in fetchDisplayAdProperties', async function () {
    const fakeCreativeId = '4255';

    // We try a call to the Gateway
    await plugin.fetchDisplayAdProperties(fakeCreativeId).then(() => {
      expect(requestPromiseProx.args[1][0].url).to.be.eq(
        `${plugin.outboundPlatformUrl}/v1/creatives/${fakeCreativeId}/renderer_properties`,
      );
    });
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});

describe('Ad Contents API test', function () {
  // Fake AdRenderer with dummy processing
  class MyFakeAdRenderer2 extends core.AdRendererBasePlugin<core.AdRendererBaseInstanceContext> {
    protected async onAdContents(request: core.AdRendererRequest, instanceContext: core.AdRendererBaseInstanceContext) {
      const response: core.AdRendererPluginResponse = {
        html: request.call_id,
      };
      return Promise.resolve(response);
    }
  }

  const plugin = new MyFakeAdRenderer2(false);
  let runner: core.TestingPluginRunner;

  it('Check that the plugin is giving good results with a simple adContents handler', function () {
    const rpMockup = sinon.stub();
    rpMockup.onCall(0).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.DataResponse<core.Creative> = {
          status: 'ok',
          data: {
            type: 'DISPLAY_AD',
            id: '7168',
            organisation_id: '1126',
            name: 'Toto',
            technical_name: 'hello',
            archived: false,
            editor_version_id: '5',
            editor_version_value: '1.0.0',
            editor_group_id: 'com.mediarithmics.creative.display',
            editor_artifact_id: 'default-editor',
            editor_plugin_id: '5',
            renderer_version_id: '1054',
            renderer_version_value: '1.0.0',
            renderer_group_id: 'com.trololo.creative.display',
            renderer_artifact_id: 'multi-advertisers-display-ad-renderer',
            renderer_plugin_id: '1041',
            creation_date: 1492785056278,
            subtype: 'BANNER',
          },
        };
        resolve(pluginInfo);
      }),
    );
    rpMockup.onCall(1).returns(
      new Promise((resolve, reject) => {
        const pluginInfo: core.PluginPropertyResponse = {
          status: 'ok',
          count: 45,
          data: [
            {
              technical_name: 'hello_world',
              value: {
                value: 'Yay',
              },
              property_type: 'STRING',
              origin: 'PLUGIN',
              writable: true,
              deletable: false,
            },
          ],
        };
        resolve(pluginInfo);
      }),
    );

    runner = new core.TestingPluginRunner(plugin, rpMockup);

    const requestBody = {
      call_id: 'auc:goo:58346725000689de0a16ac4f120ecc41-0',
      context: 'LIVE',
      creative_id: '2757',
      campaign_id: '1537',
      ad_group_id: '1622',
      protocol: 'https',
      user_agent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; MALCJS; rv:11.0) like Gecko',
      user_agent_info: {
        form_factor: 'PERSONAL_COMPUTER',
        os_family: 'WINDOWS',
        browser_family: 'IE',
        brand: null,
        model: null,
        os_version: null,
        carrier: null,
      },
      placeholder_id: 'mics_ed54e0e',
      user_campaign_id: 'toto',
      click_urls_info: [
        {
          url: 'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=',
          redirect_count: 1,
        },
        {
          url: 'https://adclick.g.doubleclick.net/aclk?sa=L&ai=CDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE&num=1&sig=AOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw&client=ca-pub-6163857992956964&adurl=',
          redirect_count: 1,
        },
      ],
      display_tracking_url:
        'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=imp&vid=4080&cb=ef3933a2-591b-4b1e-8fe2-4d9fd75980c4',
      latitude: null,
      longitude: null,
      restrictions: { animation_max_duration: 25 },
    };

    void request(runner.plugin.app)
      .post('/v1/ad_contents')
      .send(requestBody)
      .end(function (err, res) {
        expect(res.status).to.equal(200);
        expect(res.text).to.be.eq(requestBody.call_id);
      });
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
  });
});

describe('Instance Context check', () => {
  // Fake AdRenderer with dummy processing
  class MyFakeAdRenderer extends core.AdRendererBasePlugin<core.AdRendererBaseInstanceContext> {
    protected async instanceContextBuilder(creativeId: string) {
      // We check if the method was called once or twice
      ICStub();

      const IC: core.AdRendererBaseInstanceContext = {
        properties: new PropertiesWrapper([]),
        displayAd: {
          type: 'DISPLAY_AD',
          id: '7168',
          organisation_id: '1126',
          name: 'Toto',
          technical_name: undefined,
          archived: false,
          editor_version_id: '5',
          editor_version_value: '1.0.0',
          editor_group_id: 'com.mediarithmics.creative.display',
          editor_artifact_id: 'default-editor',
          editor_plugin_id: '5',
          renderer_version_id: '1054',
          renderer_version_value: '1.0.0',
          renderer_group_id: 'com.trololo.creative.display',
          renderer_artifact_id: 'multi-advertisers-display-ad-renderer',
          renderer_plugin_id: '1041',
          creation_date: 1492785056278,
          subtype: 'BANNER',
          format: '300x250',
        },
      };

      return Promise.resolve(IC);
    }

    protected async onAdContents(request: core.AdRendererRequest, instanceContext: core.AdRendererBaseInstanceContext) {
      const response: core.AdRendererPluginResponse = {
        html: request.call_id,
      };
      return Promise.resolve(response);
    }
  }

  const ICStub = sinon.stub();
  const plugin = new MyFakeAdRenderer(false);
  const runner = new core.TestingPluginRunner(plugin);

  after(() => {
    // We clear the cache so that we don't have any processing still running in the background
    runner.plugin.pluginCache.clear();
    ICStub.reset();
  });

  it('Check that the instanceContext is rebuilt at each call for PREVIEW', async function () {
    // Fake "Preview" AdCall

    const adRequest: core.AdRendererRequest = {
      call_id: 'auc:goo:58346725000689de0a16ac4f120ecc41-0',
      context: 'PREVIEW',
      creative_id: '2757',
      campaign_id: '1537',
      ad_group_id: '1622',
      protocol: 'https',
      user_agent_id: 'vec:42000',
      user_agent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; MALCJS; rv:11.0) like Gecko',
      user_agent_info: {
        form_factor: 'PERSONAL_COMPUTER',
        os_family: 'WINDOWS',
        browser_family: 'IE',
        brand: undefined,
        model: undefined,
        os_version: undefined,
        carrier: undefined,
      },
      placeholder_id: 'mics_ed54e0e',
      user_campaign_id: 'toto',
      click_urls_info: [
        {
          url: 'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=',
          redirect_count: 1,
        },
        {
          url: 'https://adclick.g.doubleclick.net/aclk?sa=L&ai=CDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE&num=1&sig=AOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw&client=ca-pub-6163857992956964&adurl=',
          redirect_count: 1,
        },
      ],
      display_tracking_url:
        'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=imp&vid=4080&cb=ef3933a2-591b-4b1e-8fe2-4d9fd75980c4',
      latitude: undefined,
      longitude: undefined,
      restrictions: { animation_max_duration: 25 },
    };

    // Plugin log level to debug
    const res1 = await request(runner.plugin.app).put('/v1/log_level').send({ level: 'silly' });
    expect(res1.status).to.equal(200);

    // First AdCall
    const res2 = await request(runner.plugin.app).post('/v1/ad_contents').send(adRequest);
    expect(res2.status).to.eq(200);

    // Second AdCall
    const res3 = await request(runner.plugin.app).post('/v1/ad_contents').send(adRequest);
    expect(res3.status).to.eq(200);
    // As it's a PREVIEW AdCall, we should have loaded the InstanceContext twice
    expect(ICStub.callCount).to.eq(2);
  });
});

describe('Click url encoding', function () {
  it('should properly encode click url (check 1)', () => {
    const url1 = 'http://foo.com';
    const url2 = 'http://bar.com';
    const url3 = 'http://baz.com';

    const redirectUrls = [
      {
        url: url1,
        redirect_count: 1,
      },
      {
        url: url2,
        redirect_count: 2,
      },
      {
        url: url3,
        redirect_count: 0,
      },
    ];

    const ur3Encoded = encodeURIComponent(encodeURIComponent(encodeURIComponent(url3)));
    const ur2Encoded = encodeURIComponent(url2);

    const result = generateEncodedClickUrl(redirectUrls);
    expect(result).to.be.eq(`${url1}${ur2Encoded}${ur3Encoded}`);
  });

  it('should properly encode click url (check 2)', () => {
    const url1 = 'http://foo.com';
    const url2 = 'http://bar.com';
    const url3 = 'http://baz.com';

    const redirectUrls = [
      {
        url: url1,
        redirect_count: 2,
      },
      {
        url: url2,
        redirect_count: 1,
      },
      {
        url: url3,
        redirect_count: 0,
      },
    ];

    const ur3Encoded = encodeURIComponent(encodeURIComponent(encodeURIComponent(url3)));
    const ur2Encoded = encodeURIComponent(encodeURIComponent(url2));

    const result = generateEncodedClickUrl(redirectUrls);
    expect(result).to.be.eq(`${url1}${ur2Encoded}${ur3Encoded}`);
  });
});

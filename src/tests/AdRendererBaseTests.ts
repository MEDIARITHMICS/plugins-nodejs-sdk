import {expect} from 'chai';
import 'mocha';
import {core} from '../';
import {PropertiesWrapper} from '../mediarithmics';
import {generateEncodedClickUrl} from '../mediarithmics/plugins/ad-renderer/utils/index';
import {newGatewaySdkMock} from '../mediarithmics/api/sdk/GatewaySdkMock';
import {IAdRendererSdk} from '../mediarithmics/api/sdk/GatewaySdk';
import {AdRendererApiTester} from '../helper';

describe('Fetch DisplayAd API', () => {
  class MyFakeAdRenderer extends core.AdRendererBasePlugin<core.AdRendererBaseInstanceContext> {
    protected async onAdContents(
      request: core.AdRendererRequest,
      instanceContext: core.AdRendererBaseInstanceContext
    ) {
      const result: core.AdRendererPluginResponse = {
        html: `All your HTML is belong to us.`
      };
      return Promise.resolve(result);
    }
  }

  const creative: core.DisplayAd = {
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
  };

  const gatewayMock = newGatewaySdkMock<IAdRendererSdk>({
    fetchDisplayAd: Promise.resolve(creative),
    fetchDisplayAdProperties: Promise.resolve({}) as any,
  });
  const plugin = new MyFakeAdRenderer({gatewaySdk: gatewayMock});

  it('Check that creativeId is passed correctly in fetchDisplayAd', async function () {
    const fakeCreativeId = '422';
    await plugin.gatewaySdk.fetchDisplayAd(fakeCreativeId);
    expect(gatewayMock.calledMethods.fetchDisplayAd.getArgs(0)?.[0] === fakeCreativeId);
  });

  it('Check that fakeCreativeId is passed correctly in fetchDisplayAdProperties', async function () {
    const fakeCreativeId = '4255';
    await plugin.gatewaySdk.fetchDisplayAdProperties(fakeCreativeId);
    expect(gatewayMock.calledMethods.fetchDisplayAdProperties.getArgs(0)?.[0] === fakeCreativeId);
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    plugin.pluginCache.clear();
  });
});

describe('Ad Contents API test', function () {
  // Fake AdRenderer with dummy processing
  class MyFakeAdRenderer2 extends core.AdRendererBasePlugin<core.AdRendererBaseInstanceContext> {
    protected async onAdContents(
      request: core.AdRendererRequest,
      instanceContext: core.AdRendererBaseInstanceContext
    ) {
      const response: core.AdRendererPluginResponse = {
        html: request.call_id
      };
      return Promise.resolve(response);
    }
  }

  const gatewayMock = newGatewaySdkMock<IAdRendererSdk>({
    fetchDisplayAdProperties: Promise.resolve([
      {
        technical_name: 'hello_world',
        value: {value: 'Yay'},
        property_type: 'STRING',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      }
    ]),
    fetchDisplayAd: Promise.resolve({
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
      format: '',
    })
  });
  const plugin = new MyFakeAdRenderer2({gatewaySdk: gatewayMock});

  it('Check that the plugin is giving good results with a simple adContents handler', async function () {
    const tester = new AdRendererApiTester(plugin);
    await tester.init();
    const requestBody = JSON.parse(`{
      "call_id":"auc:goo:58346725000689de0a16ac4f120ecc41-0",
      "context":"LIVE",
      "creative_id":"2757",
      "campaign_id":"1537",
      "ad_group_id":"1622",
      "protocol":"https",
      "user_agent":"Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; MALCJS; rv:11.0) like Gecko",
      "user_agent_info":{"form_factor":"PERSONAL_COMPUTER","os_family":"WINDOWS","browser_family":"IE","brand":null,"model":null,"os_version":null,"carrier":null},
      "placeholder_id":"mics_ed54e0e",
      "user_campaign_id":"toto",
      "click_urls_info":[{"url":"https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=", "redirect_count": 1}, {"url": "https://adclick.g.doubleclick.net/aclk?sa=L&ai=CDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE&num=1&sig=AOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw&client=ca-pub-6163857992956964&adurl=", "redirect_count": 1}],
      "display_tracking_url":"https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=imp&vid=4080&cb=ef3933a2-591b-4b1e-8fe2-4d9fd75980c4",
      "latitude":null,
      "longitude":null,
      "restrictions":{"animation_max_duration":25}
    }`);

    const res = await tester.postAdContents(requestBody);
    expect(res.text).to.be.eq(requestBody.call_id);
  });

  afterEach(() => {
    // We clear the cache so that we don't have any processing still running in the background
    plugin.pluginCache.clear();
  });
});

describe('Instance Context check', () => {
  it('Check that the instanceContext is rebuilt at each call for PREVIEW', async function () {
    let callCount = 0;

    // Fake AdRenderer with dummy processing
    class MyFakeAdRenderer extends core.AdRendererBasePlugin<core.AdRendererBaseInstanceContext> {

      protected async instanceContextBuilder(creativeId: String) {
        // We check if the method was called once or twice
        callCount++;
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
            format: '300x250'
          }
        };
        return IC;
      }

      protected async onAdContents(
        request: core.AdRendererRequest,
        instanceContext: core.AdRendererBaseInstanceContext
      ) {
        const response: core.AdRendererPluginResponse = {
          html: request.call_id
        };
        return Promise.resolve(response);
      }
    }

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
        carrier: undefined
      },
      placeholder_id: 'mics_ed54e0e',
      user_campaign_id: 'toto',
      click_urls_info: [
        {
          url: 'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=',
          redirect_count: 1
        },
        {
          url: 'https://adclick.g.doubleclick.net/aclk?sa=L&ai=CDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE&num=1&sig=AOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw&client=ca-pub-6163857992956964&adurl=',
          redirect_count: 1
        }],
      display_tracking_url: 'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=imp&vid=4080&cb=ef3933a2-591b-4b1e-8fe2-4d9fd75980c4',
      latitude: undefined,
      longitude: undefined,
      restrictions: {animation_max_duration: 25}
    };

    const plugin = new MyFakeAdRenderer();
    const tester = new AdRendererApiTester(plugin);
    await tester.initAndSetLogLevel('silly');
    await tester.postAdContents(adRequest);
    await tester.postAdContents(adRequest);
    // As it's a PREVIEW AdCall, we should have loaded the InstanceContext twice
    expect(callCount).to.eq(2);
  });
});

describe('Click url encoding', function () {
  it('should properly encode click url (check 1)', () => {
    const url1 = 'http://foo.com';
    const url2 = 'http://bar.com';
    const url3 = 'http://baz.com';

    const redirectUrls = [{
      url: url1,
      redirect_count: 1
    }, {
      url: url2,
      redirect_count: 2
    }, {
      url: url3,
      redirect_count: 0
    }];

    const ur3Encoded = encodeURIComponent(encodeURIComponent(encodeURIComponent(url3)));
    const ur2Encoded = encodeURIComponent(url2);

    const result = generateEncodedClickUrl(redirectUrls);
    expect(result).to.be.eq(`${url1}${ur2Encoded}${ur3Encoded}`);
  });

  it('should properly encode click url (check 2)', () => {
    const url1 = 'http://foo.com';
    const url2 = 'http://bar.com';
    const url3 = 'http://baz.com';

    const redirectUrls = [{
      url: url1,
      redirect_count: 2
    }, {
      url: url2,
      redirect_count: 1
    }, {
      url: url3,
      redirect_count: 0
    }];

    const ur3Encoded = encodeURIComponent(encodeURIComponent(encodeURIComponent(url3)));
    const ur2Encoded = encodeURIComponent(encodeURIComponent(url2));

    const result = generateEncodedClickUrl(redirectUrls);
    expect(result).to.be.eq(`${url1}${ur2Encoded}${ur3Encoded}`);
  });
});
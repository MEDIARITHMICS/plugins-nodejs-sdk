import {expect} from 'chai';
import 'mocha';
import {core, helper} from '@mediarithmics/plugins-nodejs-sdk';
import {MyHandlebarsAdRenderer} from '../MyPluginImpl';

describe('Test Example Handlebar Ad Renderer', function () {
  const tester = new helper.AdRendererRecoTester(MyHandlebarsAdRenderer);
  it('Check overall execution of dummy handlebar adRenderer', async function () {
    const template: string = `Hello World!`;
    const {mock, parameters} = await tester.process({template});
    expect(mock.calledMethods.fetchRecommendations.getArgs(0)?.[1] === parameters.request.user_agent_id);
  });

  it('Check encodeClickUrl macro', async function () {
    const template: string = `{{> encodeClickUrl url="http://www.mediarithmics.com/en/"}}`;
    const correctUrl = 'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=https%3A%2F%2Fadclick.g.doubleclick.net%2Faclk%3Fsa%3DL%26ai%3DCDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE%26num%3D1%26sig%3DAOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw%26client%3Dca-pub-6163857992956964%26adurl%3Dhttp%253A%252F%252Fwww.mediarithmics.com%252Fen%252F';
    expect(await tester.test({template, expectedResult: correctUrl})).true;
  });

  it('Check encodeRecoClickUrl macro', async function () {
    const template: string = `
    {{#each RECOMMENDATIONS}}
    {{> encodeRecoClickUrl }},
    {{/each}}`;

    const {compiledTemplate} = await tester.process({template});
    const urlsFromHandlebar = compiledTemplate.split(',').map(url => url.trim());

    const correctUrls = [
      'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=0&redirect=https%3A%2F%2Fadclick.g.doubleclick.net%2Faclk%3Fsa%3DL%26ai%3DCDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE%26num%3D1%26sig%3DAOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw%26client%3Dca-pub-6163857992956964%26adurl%3Dhttps%253A%252F%252Fwww.madamevacances.com%252Flocations%252Ffrance%252Falpes-du-nord%252Fflaine%252Fresidence-les-terrasses-de-veret%252F',
      'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=1&redirect=https%3A%2F%2Fadclick.g.doubleclick.net%2Faclk%3Fsa%3DL%26ai%3DCDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE%26num%3D1%26sig%3DAOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw%26client%3Dca-pub-6163857992956964%26adurl%3Dhttps%253A%252F%252Fwww.madamevacances.com%252Flocations%252Ffrance%252Falpes-du-nord%252Fval-thorens%252Fle-chalet-altitude%252F',
      'https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=2&redirect=https%3A%2F%2Fadclick.g.doubleclick.net%2Faclk%3Fsa%3DL%26ai%3DCDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE%26num%3D1%26sig%3DAOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw%26client%3Dca-pub-6163857992956964%26adurl%3Dhttps%253A%252F%252Fwww.madamevacances.com%252Flocations%252Ffrance%252Falpes-du-nord%252Fvalfrejus%252Fles-chalets-du-thabor%252F',
      '',
    ];

    expect(urlsFromHandlebar).to.be.deep.eq(
      correctUrls.map(helper.AdRendererRecoTester.escape)
    );
  });

  it('Check formatPrice macro', async function () {
    const template: string = `{{formatPrice 123.4522214 "0.00"}}`;
    const correctPrice = '123.45';
    expect(await tester.test({template, expectedResult: correctPrice})).true;
  });

  it('Check toJson macro', async function () {
    const template: string = `{{toJson REQUEST}}`;
    const {compiledTemplate, parameters} = await tester.process({template});
    expect(compiledTemplate).to.be.eq(helper.AdRendererRecoTester.escape(JSON.stringify(parameters.request)));
  });

  it('Check displayTracking', async function () {
    const template: string = `{{REQUEST.display_tracking_url}}`;
    const {compiledTemplate, parameters} = await tester.process({template});
    expect(compiledTemplate).to.be.eq(helper.AdRendererRecoTester.escape(parameters.request.display_tracking_url));
  });

  it('Check Headers', async function () {
    const template: string = `
    {{#each RECOMMENDATIONS}}
    {{> encodeRecoClickUrl }},
    {{/each}}`;

    const {response, parameters} = await tester.process({template});
    const headers = response.header['x-mics-display-context'];
    parameters.recommendations.map((prop, idx) => {
      expect(JSON.parse(headers).$clickable_contents[idx].item_id).to.be.eq(prop.$id);
      expect(JSON.parse(headers).$clickable_contents[idx].$content_id).to.be.eq(idx);
    });
  });

  it('Check that the plugin doesn\'t fail without any recommenderId provided', async function () {
    const template: string = `Hello World!`;
    const creativePropertiesResponseWithoutRecommenderId: core.PluginProperty[] = [
      {
        technical_name: 'click_url',
        value: {
          url:
            'http://www.april.fr/mon-assurance-de-pret-formulaire?cmpid=disp_datacomp_formadp_bann_300x250'
        },
        property_type: 'URL',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      },
      {
        technical_name: 'template',
        value: {
          uri: 'mics://over_the_rainbow',
          last_modified: undefined
        },
        property_type: 'DATA_FILE',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      },
      {
        technical_name: 'backup_image',
        value: {original_file_name: null, asset_id: null, file_path: null},
        property_type: 'ASSET',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      },
      {
        technical_name: 'datamart_id',
        value: {value: null},
        property_type: 'STRING',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      },
      {
        technical_name: 'default_items',
        value: {value: null},
        property_type: 'STRING',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      },
      {
        technical_name: 'recommender_id',
        value: {value: null},
        property_type: 'STRING',
        origin: 'PLUGIN',
        writable: true,
        deletable: false
      },
      {
        technical_name: 'tag_type',
        value: {value: null},
        property_type: 'STRING',
        origin: 'PLUGIN_STATIC',
        writable: false,
        deletable: false
      }
    ];
    await tester.process({template, properties: creativePropertiesResponseWithoutRecommenderId});
  });

  it('Check if plugin doesn\'t fail without any user_agent_id', async function () {
    const template: string = `Hello World!`;
    const adRequest2: core.AdRendererRequest = {...helper.adRendererFixtures.adRequest, user_agent_id: null};
    const {mock} = await tester.process({template, request: adRequest2});
    expect(mock.calledMethods.fetchRecommendations.getArgs(0)?.[1] === adRequest2.user_agent_id);
  });
});

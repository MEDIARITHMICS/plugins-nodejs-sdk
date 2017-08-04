
import * as Handlebars from "handlebars";
import {ItemProposal} from "../../core/interfaces/mediarithmics/api/UserCampaignInterface";

const handlebars = require('handlebars');
const numeral = require('numeral');
const _ = require('lodash');

export interface ClickableContent {
  item_id: number;
  $content_id: number;
}

export interface HandlebarsEngineContext {
    clickableContents: Array<ClickableContent>;
    recommendations: Array<ItemProposal>;
}

function formatPrice(price: string, pattern: string) {
  const number = numeral(price);
  return number.format(pattern);
}

const encodeClickUrl = (redirectUrls: Array<string>) => (clickUrl: string) => {
  let urls = redirectUrls.slice(0);
  urls.push(clickUrl);

  return urls.reduceRight((acc: string, current: string) => current + encodeURIComponent(acc), '');
};

const placeHolder = '{{MICS_AD_CONTENT_ID}}';
const uriEncodePlaceHolder = encodeURI(placeHolder);

const encodeRecoClickUrlHelper = (redirectUrls: Array<string>) => (idx: number, rootContext: any, recommendation: any) => {
  // recommendation.url replace placeHolder by idx
  rootContext.clickableContents.push({
    item_id: recommendation.$id,
    catalog_token: recommendation.catalog_token,
    $content_id: idx
  });
  const filledRedirectUrls = redirectUrls.map( (url: string) => {
    const url1 = _.replace(url, placeHolder, idx);
    return _.replace(url1, uriEncodePlaceHolder, idx);
  });

  console.log("URL : " + encodeClickUrl(filledRedirectUrls)(recommendation.$url));
  return encodeClickUrl(filledRedirectUrls)(recommendation.$url);
};

const encodeRecoClickUrlPartial = "{{encodeRecoClickUrlInternal @index @root this}}";


export class HandlebarsEngine {
    engine: typeof Handlebars;

    private setEncodeClickUrls(urls: Array<string>){
        this.engine.registerHelper('encodeClickUrl', encodeClickUrl(urls));
        this.engine.registerHelper('encodeRecoClickUrlInternal', encodeRecoClickUrlHelper(urls));
    };

    constructor(urls: Array<string>) {
        this.engine = Handlebars.create();
        /* Helpers */
        this.engine.registerHelper('formatPrice', formatPrice);
        this.engine.registerHelper('toJson', (object: any) => JSON.stringify(object));

        this.engine.registerPartial('encodeRecoClickUrl', encodeRecoClickUrlPartial);

        this.setEncodeClickUrls(urls); //init with empty env
    }

}
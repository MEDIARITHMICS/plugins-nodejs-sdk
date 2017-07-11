"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const logger = require('winston');

logger.level = 'info';

const app = express();
app.use(bodyParser.json({
  type: '*/*'
}));
app.get('/v1/creatives/:creativeId', function (req, res) {
  var json = `
{
  "status": "ok",
  "data": {
    "type": "DISPLAY_AD",
    "id": "7168",
    "organisation_id": "1126",
    "name": "Toto",
    "technical_name": null,
    "archived": false,
    "editor_version_id": "5",
    "editor_version_value": "1.0.0",
    "editor_group_id": "com.mediarithmics.creative.display",
    "editor_artifact_id": "default-editor",
    "editor_plugin_id": "5",
    "renderer_version_id": "1054",
    "renderer_version_value": "1.0.0",
    "renderer_group_id": "com.trololo.creative.display",
    "renderer_artifact_id": "multi-advertisers-display-ad-renderer",
    "renderer_plugin_id": "1041",
    "creation_date": 1492785056278,
    "subtype": "BANNER",
    "format": "300x250",
    "published_version": 1,
    "creative_kit": null,
    "ad_layout": null,
    "locale": null,
    "destination_domain": "splendia.com",
    "audit_status": "NOT_AUDITED",
    "available_user_audit_actions": [
      "START_AUDIT"
    ]
  }
}`;
  res.send(json);
});

app.get('/v1/creatives/:creativeId/renderer_properties', function (req, res) {
  var json = `
{
  "status":"ok",
  "data":[
    {
      "technical_name":"click_url",
      "value":{"url":"http://www.april.fr/mon-assurance-de-pret-formulaire?cmpid=disp_datacomp_formadp_bann_300x250"},
      "property_type":"URL",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"ad_layout",
      "value":{"id":"144","version":"145"},
      "property_type":"AD_LAYOUT",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"backup_image",
      "value":{"original_file_name":null,"asset_id":null,"file_path":null},
      "property_type":"ASSET",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"datamart_id",
      "value":{"value":null},
      "property_type":"STRING",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"default_items",
      "value":{"value":null},
      "property_type":"STRING",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"style_sheet",
      "value":{"id":null,"version":null},
      "property_type":"STYLE_SHEET",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"recommender_id",
      "value":{"value":1},
      "property_type":"STRING",
      "origin":"PLUGIN",
      "writable":true,
      "deletable":false
    },
    {
      "technical_name":"tag_type",
      "value":{"value":null},
      "property_type":"STRING",
      "origin":"PLUGIN_STATIC",
      "writable":false,
      "deletable":false
    }],
  "count":8
  }`;
  res.send(json);
});

app.get('/v1/ad_layouts/:adLayoutId/versions/:versionId', function (req, res) {
  var json = `
    {
  "status": "ok",
  "data": {
    "id": "276",
    "version_id": "1",
    "creation_date": 1492784898140,
    "filename": "multi_annonceur_trololo_300x250_v1.ssp",
    "template": "mics://data_file/tenants/1126/ads_templates/250.276.template",
    "ad_layout_id": "250",
    "status": "DRAFT"
  }
}`;
  res.send(json);
});

// app.get('/v1/data_file/data?:dataFilePath', function (req, res) {
//   const content = `
// <div class="header">
//    <h1>{{title}}</h1>
// </div>
// <div class="body">
//    <p>{{ad_layout_id}}</p>
// </div>
// <div class="footer">
//     <div>
//         <a href="http://twitter.com/{{recommender_id}}">{{recommender_id}}</a>
//     </div>

//     {{#each recommendations}}
//     <div>    
//         <div class="price">{{formatPrice 13 "##.000"}}</div>
//         <div>{{> encodeRecoClickUrl }}</div>
//     </div>
//     {{/each}}
//     <div>{{toJson restrictions}}</div>
//     <ul>
//       {{#each tags}}
//         <li>{{this}}</li>
//       {{/each}}
//     </ul>
// </div> 
//   `;
//   res.send(content);
// });

app.get('/v1/data_file/data?:dataFilePath', function (req, res) {
  const content = `
<!doctype html>
<html>
   <head>
      <meta charset="UTF-8">
      <title>Hotels recommendations</title>
      <style>html{margin:0;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;padding:0;height:250px;width:300px}body{margin:0;padding:0;height:100%;background-color:#fff;overflow:hidden}a{text-decoration:none}a img{border:0}html{-ms-font-feature-settings:normal}.hidden{display:none}#ad-table td{padding:0;margin:0}#ad-table{border-collapse:collapse;width:300px}.ad{position:absolute;width:300px;height:250px;}.ad>div>a{display:block}.logo{width:190px;padding:0 55px;display:block;background-color:#EA1A5B}.logo-link{height:55px}.background1{border:1px solid #EA1A5B;width:298px;height:248px;position:absolute;background-color:#fff;z-index:-1;top:0}#product1:hover #product-button1{background-color:#00a1df}#product2:hover #product-button2{background-color:#00a1df}#product3:hover #product-button3{background-color:#00a1df}.product{width:100px;text-align:left;float:left}.product>a,.page>a{display:block;width:100%}.picture-container{height:90px;text-align:center;white-space:nowrap;overflow:hidden;margin:0 5px}.picture-container .product-picture{width:90px;position:relative;top:50%;transform:translateY(-50%)}.picture-container .sales-tag-1{position:absolute;top:0;left:0;height:38px;margin-top:55px;margin-left:67px}.picture-container .sales-tag-2{position:absolute;top:0;left:0;height:38px;margin-top:55px;margin-left:167px}.picture-container .sales-tag-3{position:absolute;top:0;left:0;height:38px;margin-top:55px;margin-left:257px}.picture-container .sales-price-1{position:absolute;top:0;left:0;margin-top:65px;margin-left:72px;color:#EA1A5B;font-weight:700;font-size:15px}.picture-container .sales-price-1 .percent{font-size:9px}.picture-container .sales-price-2{position:absolute;top:0;left:0;margin-top:65px;margin-left:172px;color:#EA1A5B;font-weight:700;font-size:15px}.picture-container .sales-price-2 .percent{font-size:9px}.picture-container .sales-price-3{position:absolute;top:0;left:0;margin-top:65px;margin-left:262px;color:#EA1A5B;font-weight:700;font-size:15px}.picture-container .sales-price-3 .percent{font-size:9px}.product-title{color:#0862AD;font-weight:700;font-size:13px;margin:7px 10px;width:80px;height:45px;overflow:hidden;text-align:center}.product-brand{color:#0862AD;font-weight:700;font-size:10px;margin:7px 10px;width:80px;overflow:hidden;text-align:center}.product-price{margin:0 10px;width:80px;color:#EA1A5B;font-weight:700;font-size:14px;text-align:center}.product-price-sale{margin:0 10px;width:80px;color:#333;font-weight:700;font-size:14px;text-decoration:line-through;text-align:center}.highlighted{background-color:#00a1df!important}.product-button{height:22px;width:75px;font-weight:700;margin:7px 10px 10px;padding-top:3px;text-align:center;display:inline-block;color:#fff;background-color:#003056;border-radius:8px}</style>
   </head>
   <body>
      <div class="ad">
         <div id="page1" class="page">
            <div class="background1"></div>
            {{#each recommendations}}
            <div id="product1" class="product " onmouseout="enableHighlights()" onmouseover="disableHighlights()">
               <a href="{{> encodeRecoClickUrl }}" target="_blank">
                  <div class="picture-container"> <img class="product-picture" src="//catalog.mediarithmics.com/v1/datamarts/1089/{{this.$catalog_id}}/{{this.$item_id}}/image/small"> </div>
                  <div class="product-info">
                     <div class="product-title">{{this.$name}}</div>
                     <div class="product-price">{{formatPrice this.$price "##"}} {{this.$currency}}</div>
                     <div class="product-brand">{{this.$brand}}</div>
                     <div id="product-button1" class="product-button highlighted">Voir</div>
                  </div>
               </a>
            </div>
            {{/each}}
         </div>
      </div>
      <div style="display:none"> <img src="{{request.displayTrackingUrl}}"> </div>
      <script type="text/javascript">var restrictions = {"animation_max_duration":null};</script> <script>function getRandomInt(t,e){return Math.floor(Math.random()*(e-t+1))+t}function stopAnimation(){if("undefined"!=typeof pages){for(var t=0;t<pages.length;++t)pages[t].className=0==t?"page":"page hidden";clearTimeout(switchPageId)}for(t=0;t<productPrices.length;++t)productPrices[t].className="product-price",productSalePrices[t].className="product-price-sale hidden";clearInterval(salePricesId),clearInterval(highlightButtonsId),disableHighlights()}function switchPage(){shownPage=shownPage==pages.length-1?0:++shownPage;for(var t=0;t<pages.length;++t)pages[t].className=t==shownPage?"page":pages[t].className="hidden page";switchPageInterval=1==shownPage?12e3:2==shownPage?8e3:5e3,switchPageId=setTimeout(switchPage,switchPageInterval)}function highlightButton(){if(!disableHighlight){if(1==buttons.length)return buttons[0].className=highlightedButton%2?(++highlightedButton,"product-button highlighted"):(--highlightedButton,"product-button");highlightedButton=highlightedButton==buttons.length-1?0:++highlightedButton;for(var t=0;t<buttons.length;++t)buttons[t].className=t==highlightedButton?"product-button highlighted":"product-button"}}function disableHighlights(){disableHighlight=!0;for(var t=0;t<buttons.length;++t)buttons[t].className="product-button"}function enableHighlights(){disableHighlight=!1}function showHideSalePrice(){hiddenSalePrice=!hiddenSalePrice;var t=0;if(hiddenSalePrice)for(t=0;t<productPrices.length;++t)productPrices[t].className="product-price",productSalePrices[t].className="product-price-sale hidden";else for(t=0;t<productPrices.length;++t)productPrices[t].className="product-price hidden",productSalePrices[t].className="product-price-sale"}var buttons=document.getElementsByClassName("product-button");if(buttons.length>0){buttons[0].className="product-button highlighted";var highlightButtonsId=setInterval(highlightButton,1e3)}var highlightedButton=0,disableHighlight=buttons.length<=0,productPrices=document.querySelectorAll(".js-toggle-price .product-price"),productSalePrices=document.querySelectorAll(".js-toggle-price .product-price-sale"),hiddenSalePrice=!0,salePricesId=0;document.getElementsByClassName("js-toggle-price")&&(salePricesId=setInterval(showHideSalePrice,1e3));for(var productTitles=document.getElementsByClassName("product-title"),titlesLength=1===buttons.length?60:20,i=0;i<productTitles.length;++i)productTitles[i].textContent=productTitles[i].textContent.length>titlesLength?productTitles[i].textContent.substr(0,titlesLength)+"...":productTitles[i].textContent.substr(0,titlesLength);if(null==restrictions.animation_max_duration||restrictions.animation_max_duration>0){var pages=[document.getElementById("page1")],shownPage=0,switchPageInterval=5e3,switchPageId=setTimeout(switchPage,switchPageInterval);null!=restrictions.animation_max_duration&&setTimeout(stopAnimation,1e3*restrictions.animation_max_duration)}else stopAnimation();</script>
   </body>
</html>
  `;
  res.send(content);
});

const recommendations = `{
  "status": "ok",
  "data": {
  "ts": 1496939189652,
  "proposals": [
    {
      "$type": "ITEM_PROPOSAL",
      "$item_id": "8",
      "$id": "8",
      "$catalog_id": "16",
      "$name": "Résidence Les Terrasses de Veret***",
      "$brand": "Madame Vacance",
      "$url": "https://www.madamevacances.com/locations/france/alpes-du-nord/flaine/residence-les-terrasses-de-veret/",
      "$image_url": "http://hbs.madamevacances.com/photos/etab/87/235x130/residence_les_terrasses_de_veret_piscine.jpg",
      "$price": 160.3,
      "$sale_price": null,
      "city": "Flaine",
      "country": "France",
      "region": "Alpes du Nord",
      "zip_code": "74300"
    },
    {
      "$type": "ITEM_PROPOSAL",
      "$item_id": "7",
      "$id": "7",
      "$catalog_id": "16",
      "$name": "Le Chalet Altitude*****",
      "$brand": "Madame Vacance",
      "$url": "https://www.madamevacances.com/locations/france/alpes-du-nord/val-thorens/le-chalet-altitude/",
      "$image_url": "http://hbs.madamevacances.com/photos/etab/335/235x130/chalet_altitude_exterieure_2.jpg",
      "$price": null,
      "$sale_price": null,
      "city": "Val Thorens",
      "country": "France",
      "region": "Alpes du Nord",
      "zip_code": "73440"
    },
    {
      "$type": "ITEM_PROPOSAL",
      "$item_id": "6",
      "$id": "6",
      "$catalog_id": "16",
      "$name": "Les Chalets du Thabor***",
      "$brand": "Madame Vacance",
      "$url": "https://www.madamevacances.com/locations/france/alpes-du-nord/valfrejus/les-chalets-du-thabor/",
      "$image_url": "http://hbs.madamevacances.com/photos/etab/65/235x130/valfrejus_chalet_thabor_exterieure_2.jpg",
      "$price": 143.2,
      "$sale_price": null,
      "city": "Valfréjus",
      "country": "France",
      "region": "Alpes du Nord",
      "zip_code": "73500"
    }]
  }
}`;

app.get('/v1/display_campaigns/:campaignId/user_campaigns/:userCampaignId', function (req, res) {
  res.send({
    user_account_id: "null",
    user_agent_ids: ["vec:289388396"]
  });
});

app.post('/v1/recommenders/:recommenderId/recommendations', function (req, res) {
  res.send(recommendations);
});

// Start the plugin and listen on port 8123
app.listen(8123, function () {
  logger.info('Testing server started, listening at 8123');
});
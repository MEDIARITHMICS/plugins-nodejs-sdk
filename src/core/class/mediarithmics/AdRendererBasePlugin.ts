import * as express from "express";
import * as _ from "lodash";
import * as cache from "memory-cache";

import { AdRendererRequest } from "../../interfaces/mediarithmics/api/AdRendererRequestInterface";
import {
  Creative,
  CreativeResponse
} from "../../interfaces/mediarithmics/api/CreativeInterface";
import {
  CreativeProperty,
  CreativePropertyResponse
} from "../../interfaces/mediarithmics/api/CreativePropertyInterface";
import { AdRendererBaseInstanceContext } from "../../interfaces/mediarithmics/plugin/InstanceContextInterface";

import { BasePlugin } from "./BasePlugin";
import { TemplatingEngine } from "../../interfaces/mediarithmics/plugin/TemplatingEngineInterface";
import { AdRendererPluginResponse } from "../../interfaces/mediarithmics/api/AdRendererPluginResponseInterface";

export type AdContentHandler<T extends AdRendererBaseInstanceContext> = (
  request: AdRendererRequest,
  instanceContext: T
) => Promise<AdRendererPluginResponse>;

export class AdRendererBasePlugin<
  T extends AdRendererBaseInstanceContext
> extends BasePlugin {
  INSTANCE_CONTEXT_CACHE_EXPIRATION: number = 3000;

  instanceContext: Promise<T>;

  displayContextHeader = "x-mics-display-context";

  // Helper to fetch the creative resource with caching
  fetchCreative(creativeId: string): Promise<Creative> {
    return super
      .requestGatewayHelper(
        "GET",
        `${this.outboundPlatformUrl}/v1/creatives/${creativeId}`
      )
      .then((result: CreativeResponse) => {
        this.logger.debug(
          `Fetched Creative: ${creativeId} - ${JSON.stringify(result.data)}`
        );
        return result.data;
      });
  }

  // Helper to fetch the creative properties resource with caching
  fetchCreativeProperties(creativeId: string): Promise<CreativeProperty[]> {
    return super
      .requestGatewayHelper(
        "GET",
        `${this
          .outboundPlatformUrl}/v1/creatives/${creativeId}/renderer_properties`
      )
      .then((result: CreativePropertyResponse) => {
        this.logger.debug(
          `Fetched Creative Properties: ${creativeId} - ${JSON.stringify(
            result.data
          )}`
        );
        return result.data;
      });
  }

  getEncodedClickUrl(redirectUrls: string[]): string {
    let urls = redirectUrls.slice(0);
    return urls.reduceRight(
      (acc, current) => current + encodeURIComponent(acc),
      ""
    );
  }

  // How to bind the main function of the plugin
  setInstanceContextBuilder(
    instanceContextBuilder: (
      creativeId: string,
      templatingEngine?: TemplatingEngine
    ) => Promise<T>
  ): void {
    this.buildInstanceContext = instanceContextBuilder;
  }

  setAdContentsHandler(adContentsHandler: AdContentHandler<T>): void {
    this.onAdContents = adContentsHandler;
  }

  // Method to build an instance context
  private buildInstanceContext: (creativeId: string) => Promise<T>;

  protected onAdContents: AdContentHandler<T>;

  private initAdContentsRoute(): void {
    this.app.post(
      "/v1/ad_contents",
      (req: express.Request, res: express.Response) => {
        if (!req.body || _.isEmpty(req.body)) {
          const msg = {
            error: "Missing request body"
          };
          this.logger.error("POST /v1/ad_contents : %s", JSON.stringify(msg));
          return res.status(500).json(msg);
        } else {
          this.logger.debug(`POST /v1/ad_contents ${JSON.stringify(req.body)}`);

          const adRendererRequest = req.body as AdRendererRequest;

          if (!this.onAdContents) {
            this.logger.error("POST /v1/ad_contents: No AdContents listener registered!");
            const msg = {
              error: "No AdContents listener registered!"
            };
            return res.status(500).json(msg);
          }

          if (
            !cache.get(adRendererRequest.creative_id) ||
            adRendererRequest.context === "PREVIEW" ||
            adRendererRequest.context === "STAGE"
          ) {
            cache.put(
              adRendererRequest.creative_id,
              this.buildInstanceContext(adRendererRequest.creative_id),
              this.INSTANCE_CONTEXT_CACHE_EXPIRATION
            );
          }

          cache
            .get(adRendererRequest.creative_id)
            .then((instanceContext: T) =>
              this.onAdContents(adRendererRequest, instanceContext as T)
            )
            .then((adRendererResponse: AdRendererPluginResponse) =>
              res
                .header(
                  this.displayContextHeader,
                  JSON.stringify(adRendererResponse.displayContext)
                )
                .status(200)
                .send(adRendererResponse.html)
            )
            .catch((error: Error) => {
              this.logger.error(
                `Something bad happened : ${error.message} - ${error.stack}`
              );
              return res.status(500).send(error.message + "\n" + error.stack);
            });
        }
      }
    );
  }

  start() {
    this.initAdContentsRoute();
  }

  constructor() {
    super();

    // Default Instance context builder
    this.setInstanceContextBuilder(async (creativeId: string) => {
      console.warn(`You are using the default InstanceContextBuilder of AdRendererBasePlugin
      Is it really what you want to do?
      `);

      const creativeP = this.fetchCreative(creativeId);
      const creativePropsP = this.fetchCreativeProperties(creativeId);

      const results = await Promise.all([creativeP, creativePropsP]);

      const creative = results[0];
      const creativeProps = results[1];

      const context = {
        creative: creative,
        creativeProperties: creativeProps
      } as T;

      return context;
    });
  }
}

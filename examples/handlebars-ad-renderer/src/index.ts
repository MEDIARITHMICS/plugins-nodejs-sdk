import {
  core, extra
} from "@mediarithmics/plugins-nodejs-sdk";

// All the magic is here
const plugin = new extra.HandlebarsAdRendererPlugin(
  (
    request: core.AdRendererRequest,
    instanceContext: extra.AdRendererHandlebarsTemplateInstanceContext
  ) => new extra.HandlebarsEngine(request.click_urls).engine
);

plugin.start();

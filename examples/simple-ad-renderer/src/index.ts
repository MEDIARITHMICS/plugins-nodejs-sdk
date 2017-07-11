import { core } from "@mediarithmics/plugins-nodejs-sdk";

//All the magic is here
const plugin = new core.AdRendererBasePlugin(
  (
    request: core.AdRendererRequest,
    instanceContext: core.AdRendererBaseInstanceContext
  ) => Promise.resolve(
    `<html>
    <body>
    <h1>Creative: ${instanceContext.creative.name}</h1>
    <br/>
    <p>
    Powered by the Ad Renderer: ${instanceContext.creative
      .renderer_group_id}:${instanceContext.creative
      .renderer_artifact_id} v.${instanceContext.creative
      .renderer_version_value}
    </p>
    <!-- We always need to include the mediarithmics impression tracking pixel -->
    <img src="${request.display_tracking_url}" />
    </body>
    </html>`
  )
);

plugin.start();

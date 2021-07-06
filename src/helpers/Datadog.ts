import winston, { Logger } from "winston";

import HttpsProxyAgent from "https-proxy-agent";
import yaml from "js-yaml";
import fs from "fs";

interface IDatadogIntegration {
  enabled: boolean;
  config?: IDatadogConfig;
}

interface IDatadogConfig {
  apiKey: string;
  tags: ReadonlyArray<string>;
  tagsAsObj: { [key: string]: unknown };
  site: string;
  service: string;
}

interface IDatadogConfigFile {
  api_key: string;
  tags?: ReadonlyArray<string>;
  site?: string;
}

const datadogIntegration: IDatadogIntegration = {
  enabled: false,
  config: undefined,
};

const datadogConfFile = "/etc/datadog-agent/datadog.yaml";

if (process.env.NODE_ENV === "production" && fs.existsSync(datadogConfFile)) {
  try {
    const datadogConfContent = fs.readFileSync(datadogConfFile, "utf8");
    const dataDogConf = yaml.load(datadogConfContent) as IDatadogConfigFile;

    const datadogKey = dataDogConf["api_key"] || "";
    const datadogEnabled = datadogKey.length > 0;
    const datadogTags = dataDogConf["tags"] || [];
    const tagsAsObj = datadogTags.reduce((acc, tag) => {
      const i = tag.indexOf(":");
      const tagName = tag.slice(0, i);
      const tagValue = tag.slice(i + 1);

      acc[tagName] = tagValue;

      return acc;
    }, {} as { [key: string]: string });

    const datadogSite = dataDogConf["site"] || "datadoghq.eu";

    const pluginName = tagsAsObj["plugin_name"] || "mics-plugin";

    datadogIntegration.enabled = datadogEnabled;
    datadogIntegration.config = {
      apiKey: datadogKey,
      tags: datadogTags,
      tagsAsObj: tagsAsObj,
      site: datadogSite,
      service: pluginName,
    };
  } catch (err) {
    // we need the configuration before the tracer init, we need the tracer init before anything else.
    const stack = (err as Error).stack || "";
    // eslint-disable-next-line no-console
    console.error(
      `Can't setup the datadog integration: ${
        (err as Error).message
      } - ${stack}`
    );
  }
}

export const activateDatadog = (proxyUrl: string, logger: Logger): void => {
  if (datadogIntegration.enabled) {
    const datadogConfig = datadogIntegration.config!;
    try {
      const httpTransportOptions = {
        host: `http-intake.logs.${datadogConfig.site}`,
        path: `/v1/input/${datadogConfig.apiKey}?ddsource=nodejs&service=${
          datadogConfig.service
        }&ddtags=${encodeURIComponent(datadogConfig.tags.join(","))}`,
        agent: HttpsProxyAgent(proxyUrl),
        ssl: true,
      };

      logger.configure({
        exitOnError: false,
        format: winston.format.combine(
          winston.format.splat(),
          winston.format.json()
        ),

        transports: [
          new winston.transports.Console(),
          new winston.transports.Http(httpTransportOptions),
        ],
      });

      logger.info(
        `Configured http transport to ${httpTransportOptions.host} with the proxy ${proxyUrl}`
      );
    } catch (err) {
      const stack = (err as Error).stack || "";
      logger.error(
        `Can't setup datadog log connector: ${
          (err as Error).message
        } - ${stack}`
      );
    }
  }
};

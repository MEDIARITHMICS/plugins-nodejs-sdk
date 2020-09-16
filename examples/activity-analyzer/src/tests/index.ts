import "mocha";

import * as helpers from "@mediarithmics/plugins-nodejs-sdk/lib/helpers/ActivityAnalyzerTestHelper";

import { MyActivityAnalyzerPlugin } from "../MyPluginImpl";
import { core } from "@mediarithmics/plugins-nodejs-sdk";

describe("Test Example Activity Analyzer", function () {
  const activityAnalyzerProperties: core.PluginPropertyResponse = {
    count: 1,
    data: [
      {
        technical_name: "analyzer_rules",
        value: {
          uri:
            "mics://data_file/tenants/10001/plugins_conf/activity_analyzer.conf",
          last_modified: 123456,
        },
        property_type: "DATA_FILE",
        origin: "PLUGIN",
        writable: true,
        deletable: true,
      },
    ],
    status: "ok",
  };

  const itFactory = helpers.itFactory(
    new MyActivityAnalyzerPlugin(),
    activityAnalyzerProperties
  );

  itFactory(
    "Check behavior of dummy activity analyzer",
    require(`${process.cwd()}/src/tests/activity_input`),
    require(`${process.cwd()}/src/tests/activity_output`)
  );
});

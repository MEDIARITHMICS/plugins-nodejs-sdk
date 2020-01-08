import 'mocha';
import {MyActivityAnalyzerPlugin} from '../MyPluginImpl';
import {core, helper} from '@mediarithmics/plugins-nodejs-sdk';
import {expect} from 'chai';

describe('Test Example Activity Analyzer', function () {
  it('Check behavior of dummy activity analyzer', async function () {
    const activityAnalyzerProperties: core.PluginProperty[] = [
      {
        technical_name: 'analyzer_rules',
        value: {
          uri:
            'mics://data_file/tenants/10001/plugins_conf/activity_analyzer.conf',
          last_modified: 123456
        },
        property_type: 'DATA_FILE',
        origin: 'PLUGIN',
        writable: true,
        deletable: true
      }
    ];

    const activityAnalyzer: core.ActivityAnalyzer = {
      id: '1000',
      name: 'my analyzer',
      organisation_id: '1000',
      visit_analyzer_plugin_id: 1001,
      group_id: 'com.mediarithmics.visit-analyzer',
      artifact_id: 'default'
    };

    const equals = await new helper.ActivityAnalyzerTester(MyActivityAnalyzerPlugin).test({
      input: require(`${process.cwd()}/src/tests/activity_input`),
      expectedOutput: require(`${process.cwd()}/src/tests/activity_output`),
    });
    expect(equals).true;
  });
});

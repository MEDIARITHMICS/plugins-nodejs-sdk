import {ActivityAnalyzer, PluginProperty} from '../../mediarithmics';

export const activityAnalyzerFixtures: {
  properties: PluginProperty[]
  activityAnalyzer: ActivityAnalyzer
} = {
  properties: [
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
  ],
  activityAnalyzer: {
    id: '1000',
    name: 'my analyzer',
    organisation_id: '1000',
    visit_analyzer_plugin_id: 1001,
    group_id: 'com.mediarithmics.visit-analyzer',
    artifact_id: 'default'
  }
};
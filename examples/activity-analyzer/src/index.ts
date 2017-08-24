import {
  core
} from '@mediarithmics/plugins-nodejs-sdk';

// All the magic is here
const plugin = new core.ActivityAnalyzerPlugin();

plugin.setOnActivityAnalysis((
  request: core.ActivityAnalyzerRequest,
  instanceContext: core.ActivityAnalyzerBaseInstanceContext
) => {
  const updatedActivity = request.activity;
  const response: core.ActivityAnalyzerPluginResponse = {
    status: "ok",
    data: null
  };

  // We add a field on the processed activitynégative
  updatedActivity.processed_by = `${instanceContext.activityAnalyzer
    .group_id}:${instanceContext.activityAnalyzer
    .artifact_id} v.${instanceContext.activityAnalyzer
    .visit_analyzer_plugin_id}`;
  response.data = updatedActivity;

  return response;
});

plugin.start();

import {ActivityAnalyzer, ActivityAnalyzerPlugin, BasePluginProps, IActivityAnalyzerSdk, LogLevel, newGatewaySdkMock, PluginProperty} from '../../mediarithmics';
import {ActivityAnalyzerApiTester} from '../PluginApiTester';
import {activityAnalyzerFixtures} from './ActivityAnalyzerFixtures';

interface ActivityAnalyzerTesterProps {
  input: any,
  properties?: PluginProperty[],
  activityAnalyzer?: ActivityAnalyzer
}

export class ActivityAnalyzerTester {

  constructor(
    private Plugin: new (props?: BasePluginProps) => ActivityAnalyzerPlugin,
    private logLevel: LogLevel = 'info') {
  }

  readonly test = async ({expectedOutput, ...props}: ActivityAnalyzerTesterProps & {expectedOutput: any,}): Promise<any> => {
    const output = await this.process(props);
    return ActivityAnalyzerTester.compare(output, expectedOutput);
  };

  readonly process = async ({
    input,
    properties = activityAnalyzerFixtures.properties,
    activityAnalyzer = activityAnalyzerFixtures.activityAnalyzer,
  }: ActivityAnalyzerTesterProps): Promise<any> => {
    const gatewayMock = newGatewaySdkMock<IActivityAnalyzerSdk>({
      fetchActivityAnalyzer: Promise.resolve(activityAnalyzer),
      fetchActivityAnalyzerProperties: Promise.resolve(properties),
    });
    const plugin = new this.Plugin({gatewaySdk: gatewayMock});
    const tester = new ActivityAnalyzerApiTester(plugin);
    await tester.initAndSetLogLevel(this.logLevel);
    const res = await tester.postActivityAnalysis(input);
    plugin.pluginCache.clear();
    return JSON.parse(res.text);
  };

  static readonly compare = (input: any, output: any): boolean => {
    return JSON.stringify(input) === JSON.stringify(output);
  };
}
import {BasePluginProps} from '../../mediarithmics/plugins/common';
import {
  AdRendererRecoTemplatePlugin,
  AdRendererRequest,
  GatewaySdkMock,
  IAdRendererRecoSdk,
  IAdRendererSdk,
  IBaseSdk,
  Index,
  ItemProposal,
  LogLevel,
  newGatewaySdkMock,
  PluginProperty
} from '../../mediarithmics';
import {DisplayAd} from '../../mediarithmics/api/core/creative/CreativeInterface';
import {AdRendererApiTester} from '../PluginApiTester';
import {Response} from 'supertest';
import {adRendererFixtures} from './AdRendererFixtures';

interface AdRendererTesterProps {
  template: string,
  creative?: DisplayAd,
  properties?: PluginProperty[],
  recommendations?: ItemProposal[],
  request?: AdRendererRequest
}

export class AdRendererRecoTester {

  constructor(
    private Plugin: new (props?: BasePluginProps) => AdRendererRecoTemplatePlugin,
    private logLevel: LogLevel = 'info') {
  }

  static readonly escape = (value: string): string => {
    const escape: Index<string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#x27;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    return value.replace(/[&<>"'`=]/g, (chr: string) => escape[chr]);
  };

  readonly test = async ({expectedResult, escape, ...props}: AdRendererTesterProps & {expectedResult: string, escape?: boolean}) => {
    const {compiledTemplate} = await this.process(props);
    return AdRendererRecoTester.compare(compiledTemplate, expectedResult, escape || true);
  };

  readonly process = async ({
    template,
    creative = adRendererFixtures.creative,
    properties = adRendererFixtures.creativePropertiesResponse,
    recommendations = adRendererFixtures.recommendations,
    request = adRendererFixtures.adRequest,
  }: AdRendererTesterProps): Promise<{
    mock: GatewaySdkMock<IAdRendererSdk & IAdRendererRecoSdk & IBaseSdk>,
    response: Response
    compiledTemplate: string
    plugin: BasePluginProps,
    parameters: {
      creative: DisplayAd,
      properties: PluginProperty[],
      recommendations: ItemProposal[],
      request: AdRendererRequest
    }
  }> => {
    const mock = newGatewaySdkMock<IAdRendererSdk & IAdRendererRecoSdk & IBaseSdk>({
      fetchDisplayAd: Promise.resolve(creative),
      fetchDataFile: Promise.resolve(new Buffer(template)),
      fetchDisplayAdProperties: Promise.resolve(properties),
      fetchRecommendations: Promise.resolve(recommendations),
      fetchConfigurationFile: Promise.resolve({} as any),
      fetchUserCampaign: Promise.resolve({} as any),
    });
    const plugin = new this.Plugin({gatewaySdk: mock});
    const tester = new AdRendererApiTester(plugin);
    await tester.init();
    const response = await tester.postAdContents(request);
    plugin.pluginCache.clear();
    return {
      plugin,
      parameters: {creative, properties, recommendations, request,},
      mock,
      response,
      compiledTemplate: response.text.trim()
    };
  };

  static readonly compare = (compiledTemplate: string, expectedResult: string, escape = true) => {
    return compiledTemplate === (escape
      ? AdRendererRecoTester.escape(expectedResult)
      : expectedResult);
  };
}

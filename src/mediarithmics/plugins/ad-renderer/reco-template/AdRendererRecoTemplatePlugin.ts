import {AdRendererTemplateInstanceContext, AdRendererTemplatePlugin} from '../template/AdRendererTemplatePlugin';
import {map} from '../../../utils';
import {BasePluginProps} from '../../common';

export interface AdRendererRecoTemplateInstanceContext
  extends AdRendererTemplateInstanceContext {
  recommender_id?: string;
}

export abstract class AdRendererRecoTemplatePlugin extends AdRendererTemplatePlugin {
  constructor(props?: BasePluginProps) {
    super(props);
  }

  protected async instanceContextBuilder(creativeId: string) {
    const baseInstanceContext = await super.instanceContextBuilder(creativeId);

    const recommenderProperty = baseInstanceContext.properties.findStringProperty('recommender_id');

    const context: AdRendererRecoTemplateInstanceContext = {
      ...baseInstanceContext,
      recommender_id: map(recommenderProperty, p => p.value.value)
    };

    return context;
  }
}

import { ExploreableInternalsTemplatingEngine, ProfileDataTemplater } from '../../common/TemplatingInterface';
import { EmailRendererBaseInstanceContext, EmailRendererPlugin } from '../base/EmailRendererBasePlugin';

export interface EmailRendererTemplateInstanceContext extends EmailRendererBaseInstanceContext {
  // Raw template to be compiled
  template: unknown;
  // Compiled template
  render_template?: (...args: unknown[]) => string;
}

export abstract class EmailRendererTemplatePlugin extends EmailRendererPlugin<EmailRendererTemplateInstanceContext> {
  /**
   * The engineBuilder that can be used to compile the template
   * during the InstanceContext building
   *
   * Have to be overriden (see examples)
   */
  protected abstract engineBuilder: ExploreableInternalsTemplatingEngine<unknown, unknown, unknown, unknown> &
    ProfileDataTemplater;

  constructor(enableThrottling = false) {
    super(enableThrottling);
  }
}

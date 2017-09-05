import { AdRendererBaseInstanceContext } from "./InstanceContextInterface";

export interface TemplatingEngine {

    init: (opts?: any) => void;
    compile: (template: any) => any;

}
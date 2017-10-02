import { Value } from "./ValueInterface";
import { ResponseListOfData } from "./Response";

export type PluginPropertyResponse = ResponseListOfData<PluginProperty>;

export interface PluginProperty {
  technical_name: string;
  value: Value;
  property_type: string;
  origin: string;
  writable: boolean;
  deletable: boolean;
}

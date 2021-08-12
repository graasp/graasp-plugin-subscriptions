import { UnknownExtra } from "graasp";

export interface CustomerExtra extends UnknownExtra {
  customerId?: string;
  subscriptionId?: string;
}

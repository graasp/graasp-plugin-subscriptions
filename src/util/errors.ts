import { GraaspError, GraaspErrorDetails } from "graasp";

export class GraaspSubscriptionsError implements GraaspError {
  name: string;
  code: string;
  message: string;
  statusCode?: number;
  data?: unknown;
  origin: "core" | "plugin";

  constructor({ code, statusCode, message }: GraaspErrorDetails, data?: unknown) {
    this.name = code;
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
    this.origin = "plugin";
  }
}

export class PlanNotFound extends GraaspSubscriptionsError {
  constructor(data?: unknown) {
    super({ code: "GSERR001", statusCode: 404, message: "Plan not found" }, data);
  }
}

export class CustomerNotFound extends GraaspSubscriptionsError {
  constructor(data?: unknown) {
    super({ code: "GSERR002", statusCode: 404, message: "Customer not found" }, data);
  }
}

export class SubscriptionNotFound extends GraaspSubscriptionsError {
  constructor(data?: unknown) {
    super({ code: "GSERR003", statusCode: 404, message: "Subscription not found" }, data);
  }
}

export class CardNotFound extends GraaspSubscriptionsError {
  constructor(data?: unknown) {
    super({ code: "GSERR004", statusCode: 404, message: "Card not found" }, data);
  }
}

export class PayementFailed extends GraaspSubscriptionsError {
  constructor(data?: unknown) {
    super({ code: "GSERR005", statusCode: 402, message: "Payement Failed" }, data);
  }
}

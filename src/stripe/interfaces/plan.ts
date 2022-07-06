export interface Plan {
  id: string;
  name: string;
  prices: Price[];
  description: string;
  level: number;
}

export interface Price {
  id: string;
  price: number;
  currency: string;
  interval: string;
}

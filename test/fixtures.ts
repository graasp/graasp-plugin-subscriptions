export const CURRENT_CUSTOMER = {
  id: 'cus_AnnaStipeId',
  name: 'anna',
  email: 'anna@mail.com',
  defaultCard: 'pm_AnnaPmStripeId',
};

export const CURRENT_MEMBER = {
  name: 'anna',
  email: 'anna@mail.com',
  id: 'anna-id',
};

export const DEFAULT_CARD = {
  id: 'pm_mastercardId',
  brand: 'mastercard',
  lastFourDigits: '4444',
};

export const SETUP_INTENT = {
  clientSecret: 'seti_identifer_secret_secretkey',
};

export const PRICE = {
  id: 'price_priceId',
  price: 15,
  currency: 'chf',
  interval: 'month',
};

export const PLAN = {
  id: 'prod_productId',
  name: 'Standard Plan',
  prices: [
    PRICE,
    {
      ...PRICE,
      currency: 'eur',
    },
  ],
  description: 'description',
  level: 1,
};

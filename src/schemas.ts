import { Stripe } from 'stripe';

export default {
  $id: 'http://graasp.org/subscriptions/',
  definitions: {
    planIdParam: {
      type: 'object',
      required: ['planId'],
      properties: {
        planId: { type: 'string' },
      },
    },

    cardIdParam: {
      type: 'object',
      required: ['cardId'],
      properties: {
        cardId: { type: 'string' },
      },
    },

    plan: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        price: { type: 'number' },
        currency: { type: 'string' },
        interval: { type: 'string' },
        description: { type: 'string' },
        level: { type: 'number' },
      },
      additionalProperties: false,
    },

    invoice: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        amountDue: { type: 'number' },
        currency: { type: 'string' },
      },
      additionalProperties: false,
    },

    card: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        brand: { type: 'string' },
        lastFourDigits: { type: 'string' },
      },
      additionalProperties: false,
    },

    intent: {
      type: 'object',
      properties: {
        clientSecret: { type: 'string' },
      },
      additionalProperties: false,
    },

    customer: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        defaultCard: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

// schema for getting plans
const getPlans = {
  response: {
    200: {
      type: 'array',
      items: { $ref: 'http://graasp.org/subscriptions/#/definitions/plan' },
    },
  },
};

// schema for getting own plan
const getOwnPlan = {
  response: {
    200: { $ref: 'http://graasp.org/subscriptions/#/definitions/plan' },
  },
};

// schema for changing plan
const changePlan = {
  params: { $ref: 'http://graasp.org/subscriptions/#/definitions/planIdParam' },
  response: {
    200: { $ref: 'http://graasp.org/subscriptions/#/definitions/plan' },
  },
};

// schema for getting proration preview
const getProrationPreview = {
  params: { $ref: 'http://graasp.org/subscriptions/#/definitions/planIdParam' },
  response: {
    200: { $ref: 'http://graasp.org/subscriptions/#/definitions/invoice' },
  },
};

const getCards = {
  response: {
    200: {
      type: 'array',
      items: { $ref: 'http://graasp.org/subscriptions/#/definitions/card' },
    },
  },
};

const setDefaultCard = {
  params: { $ref: 'http://graasp.org/subscriptions/#/definitions/cardIdParam' },
  response: {
    200: { $ref: 'http://graasp.org/subscriptions/#/definitions/card' },
  },
};

const createSetupIntent = {
  response: {
    200: { $ref: 'http://graasp.org/subscriptions/#/definitions/intent' },
  },
};

const getCurrentCustomer = {
  response: {
    200: { $ref: 'http://graasp.org/subscriptions/#/definitions/customer' },
  },
};

export {
  getPlans,
  getOwnPlan,
  changePlan,
  getProrationPreview,
  getCards,
  setDefaultCard,
  createSetupIntent,
  getCurrentCustomer,
};

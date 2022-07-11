# graasp-plugin-subscriptions

This plugin enables users to subscribe to different plans according to their needs.

It uses `Stripe` to handle cards, payments and subscriptions. The maximum of the data should be processed on the backend and only the necessary data should be sent to `Stripe`.

This plugin allows the user to perform the following action:

- Be subscribed to the default plan automatically
- Add a new card to their account
- Subscribe to a different plan
- Get all plans or their current plan
- Change the default card

## Stripe

Currently, this plugins needs to have `Stripe` configured. The following resources needs to be created :

- **Products:** products represents the plan (free, standard, premium) 
- **Metadata:** metadata allow to rank and filter (group, individual) the products
- **Prices:** prices are linked to a product, every products must have the same currencies 

The minimal information for a product are the following (more information could be moved to `Graasp` database):

```json
  {
    "id": "prod_xxx",
    "name": "Free plan",
    "description": "2GB of storage",
    "metadata": [
      { "type": "INDIVIDUAL_PLAN" },
      { "level": 0 }
    ],
  }
```

Currently, the prices are using a monthly interval. All products should have the same currencies as a customer can only pay in one currency. The price of a product should contain the follwing informations:

```json
  {
    "id": "price_xxx",
    "product": "prod_xxx",
    "price": 3000, // price in cents (30.00 CHF)
    "currency": "CHF",
    "interval": "day | week | month | year",
  }
```

Currently, the subscriptions are automatically charged. When a customer changes their plan, the backend changes the price attached to the subscription. When a subscription is updated the price is calculated using a [proration](https://stripe.com/docs/billing/subscriptions/prorations) from the time of change. The subscriptions contains the following data:

```json
{
  "collection_method": "charge_automatically | send_invoice",
  "customer": "cus_xxx",
  "default_payment_method": "pm_xxx",
  "items": [
    { "id": "sub_xxx", "price": "price_xxx" }
  ]
}
```

## Plans

Plans are stored on `Graasp` database, they allow the backend to easily access the plan data. For example, the upload limiter can easily access the `storage` value to ensure a user isn't breaking their quota. Currently the `plan` table contains the following columns:

| Column Name | Type   | Description
| ----------- | -------| -----------
| id          | UUIDv4 | Unique identifier of the plan in the `Graasp` database 
| plan_id     | string | Identifier in the `Stripe` database, can be set to anything for a custom plan (eg. unlimited) 
| storage     | bigint | Allowed storage for this plan in GB, caller needs to do the conversion if necessary

## Subscriptions

Subscriptions are filling the following roles:

- Link a `Graasp` user to the default plan when created
- Link a `Graasp` user with their current plan
- Link a `Graasp` user with their corresponding `Stripe` customer
- Link a `Graasp` user with their corresponding `Stripe` subscriptions

Currently the `member_plan` table contains the following columns:

| Column Name     | Type   | Description
| ----------------| -------| -----------
| id              | UUIDv4 | Unique identifier of the subscription in the `Graasp` database 
| member_id       | UUIDv4 | Id of the member
| plan_id         | UUIDv4 | Id of the current plan for the member
| customer_id     | string / NULL | Id of the customer in  `Stripe`, only set if the member has added a card
| subscription_id | string / NULL | Id of the subscription in `Stripe`, only set if the member has changed to a payed plan

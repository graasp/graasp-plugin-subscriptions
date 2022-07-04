create table plan(
  "id" uuid UNIQUE DEFAULT uuid_generate_v4(),
  "plan_id" character varying(100) NOT NULL,
  "storage" integer,
  "created_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  "updated_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TRIGGER "plan_set_timestamp"
BEFORE UPDATE ON "plan" 
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();


create table member_plan(
  "id" uuid UNIQUE DEFAULT uuid_generate_v4(),
  "creator" uuid REFERENCES "member" ("id") ON DELETE CASCADE,
  "plan_id" uuid REFERENCES "plan" ("id"),
  "customer_id" character varying(100),
  "subscription_id" character varying(100),
  "created_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  "updated_at" timestamp NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TRIGGER "member_plan_set_timestamp"
BEFORE UPDATE ON "member_plan" 
FOR EACH ROW 
EXECUTE PROCEDURE trigger_set_timestamp();
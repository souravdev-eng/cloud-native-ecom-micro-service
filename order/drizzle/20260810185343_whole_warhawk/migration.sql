CREATE TYPE "order_status" AS ENUM('created', 'awaiting_payment', 'paid', 'cancelled', 'complete');--> statement-breakpoint
CREATE TABLE "products" (
	"product_id" varchar(255) PRIMARY KEY,
	"title" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"original_price" integer NOT NULL,
	"image" varchar(1024) NOT NULL,
	"seller_id" varchar(255) NOT NULL,
	"category" varchar(255) DEFAULT 'other' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" varchar(255) NOT NULL,
	"status" "order_status" DEFAULT 'created'::"order_status" NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"image" varchar(1024),
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
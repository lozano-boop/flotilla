CREATE TABLE "driver_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" varchar NOT NULL,
	"type" text NOT NULL,
	"document_number" text,
	"issue_date" date,
	"expiry_date" date,
	"status" text DEFAULT 'valid' NOT NULL,
	"file_path" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"license_number" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"license_expiry" date,
	"status" text DEFAULT 'active' NOT NULL,
	"license_pdf" text,
	"address_proof_pdf" text,
	"ine_pdf" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "drivers_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" date NOT NULL,
	"receipt" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"cost" numeric(10, 2),
	"performed_at" date NOT NULL,
	"next_due" date,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"driver_id" varchar,
	"insurance_pdf" text,
	"insurance_expiry" date,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);

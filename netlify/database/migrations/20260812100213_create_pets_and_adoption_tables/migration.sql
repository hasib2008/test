CREATE TABLE "adoption" (
	"id" serial PRIMARY KEY,
	"pet_id" integer NOT NULL,
	"name" text NOT NULL,
	"surname" text NOT NULL,
	"city" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"pet_id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"species" text NOT NULL,
	"breed" text,
	"age" integer,
	"gender" text,
	"description" text,
	"photo_url" text,
	"available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adoption" ADD CONSTRAINT "adoption_pet_id_pets_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id");
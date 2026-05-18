CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"original_filename" text NOT NULL,
	"generated_filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'temporary' NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"entity_field" text,
	"public_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "media_files_status_created_at_idx" ON "media_files" USING btree ("status","created_at");
--> statement-breakpoint
CREATE INDEX "media_files_user_id_idx" ON "media_files" USING btree ("user_id");

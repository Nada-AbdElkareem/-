CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT '"2026-05-21T13:38:45.063Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_settings_key_unique` ON `app_settings` (`key`);--> statement-breakpoint
CREATE TABLE `assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`room_id` integer,
	`purchase_date` integer,
	`purchase_cost` real DEFAULT 0 NOT NULL,
	`lifespan_months` integer DEFAULT 60 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`serial_number` text,
	`description` text,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`target_table` text,
	`target_id` integer,
	`details` text,
	`created_at` integer DEFAULT '"2026-05-21T13:38:45.066Z"' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `beds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`bed_number` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `companions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`full_name` text NOT NULL,
	`national_id` text NOT NULL,
	`relationship` text NOT NULL,
	`mobile` text,
	`is_emergency_contact` integer DEFAULT false NOT NULL,
	`gender` text NOT NULL,
	`age` integer,
	`asylum_status` text,
	`notes` text,
	`created_at` integer DEFAULT '"2026-05-21T13:38:45.064Z"' NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `patient_comp_idx` ON `companions` (`patient_id`);--> statement-breakpoint
CREATE INDEX `comp_national_id_idx` ON `companions` (`national_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer DEFAULT '"2026-05-21T13:38:45.064Z"' NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `patient_doc_idx` ON `documents` (`patient_id`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`min_quantity` integer DEFAULT 0 NOT NULL,
	`current_quantity` integer DEFAULT 0 NOT NULL,
	`price_per_unit` real DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT '"2026-05-21T13:38:45.066Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`reason` text,
	`performed_by` integer NOT NULL,
	`transaction_date` integer DEFAULT '"2026-05-21T13:38:45.066Z"' NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stay_id` integer NOT NULL,
	`total_amount` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`final_amount` real NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`created_at` integer DEFAULT '"2026-05-21T13:38:45.066Z"' NOT NULL,
	FOREIGN KEY (`stay_id`) REFERENCES `stays`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` integer NOT NULL,
	`schedule_id` integer,
	`action_date` integer DEFAULT '"2026-05-21T13:38:45.066Z"' NOT NULL,
	`action_taken` text NOT NULL,
	`result` text NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	`performed_by` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_id`) REFERENCES `maintenance_schedules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `maintenance_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` integer NOT NULL,
	`task_name` text NOT NULL,
	`frequency_days` integer NOT NULL,
	`last_maintenance_date` integer,
	`next_maintenance_date` integer NOT NULL,
	`assigned_to` text,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`national_id` text NOT NULL,
	`passport_number` text,
	`gender` text NOT NULL,
	`dob` text NOT NULL,
	`mobile` text NOT NULL,
	`emergency_contact` text,
	`emergency_phone` text,
	`governorate` text NOT NULL,
	`address` text NOT NULL,
	`diagnosis` text,
	`specialty` text,
	`hospital` text,
	`doctor` text,
	`referral_org` text,
	`status` text DEFAULT 'active',
	`notes` text,
	`photo_url` text,
	`documents_urls` text,
	`case_status` text DEFAULT 'stable',
	`created_at` integer DEFAULT '"2026-05-21T13:38:45.063Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_national_id_unique` ON `patients` (`national_id`);--> statement-breakpoint
CREATE INDEX `full_name_idx` ON `patients` (`full_name`);--> statement-breakpoint
CREATE INDEX `national_id_idx` ON `patients` (`national_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `patients` (`created_at`);--> statement-breakpoint
CREATE INDEX `mobile_idx` ON `patients` (`mobile`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`building` text NOT NULL,
	`floor` text NOT NULL,
	`room_number` text NOT NULL,
	`type` text NOT NULL,
	`capacity` integer NOT NULL,
	`status` text DEFAULT 'available' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit_cost` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stay_companions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stay_id` integer NOT NULL,
	`companion_id` integer NOT NULL,
	FOREIGN KEY (`stay_id`) REFERENCES `stays`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`companion_id`) REFERENCES `companions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stay_services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stay_id` integer NOT NULL,
	`service_id` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`total_cost` real NOT NULL,
	`service_date` integer DEFAULT '"2026-05-21T13:38:45.065Z"' NOT NULL,
	`notes` text,
	FOREIGN KEY (`stay_id`) REFERENCES `stays`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stay_id_idx` ON `stay_services` (`stay_id`);--> statement-breakpoint
CREATE TABLE `stays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` integer NOT NULL,
	`room_id` integer NOT NULL,
	`bed_id` integer NOT NULL,
	`check_in_date` integer DEFAULT '"2026-05-21T13:38:45.065Z"' NOT NULL,
	`expected_check_out_date` integer,
	`actual_check_out_date` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`letter_duration` integer,
	`letter_url` text,
	`parent_stay_id` integer,
	`notes` text,
	`admission_notes` text,
	`discharge_notes` text,
	`created_at` integer DEFAULT '"2026-05-21T13:38:45.065Z"' NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bed_id`) REFERENCES `beds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `patient_id_idx` ON `stays` (`patient_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'data_entry' NOT NULL,
	`created_at` integer DEFAULT '"2026-05-21T13:38:45.062Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
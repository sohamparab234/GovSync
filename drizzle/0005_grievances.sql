CREATE TABLE IF NOT EXISTS `grievances` (
	`id` text PRIMARY KEY NOT NULL,
	`reference_number` text NOT NULL UNIQUE,
	`owner` text NOT NULL,
	`citizen_id` text NOT NULL,
	`category` text NOT NULL,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`application_id` text,
	`service` text,
	`department` text,
	`department_verified` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`citizen_response` text,
	`admin_note` text,
	`resolution_summary` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_grievances_owner` ON `grievances` (`owner`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_grievances_app` ON `grievances` (`application_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_grievances_status` ON `grievances` (`status`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `grievance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`grievance_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`actor_role` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`grievance_id`) REFERENCES `grievances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_grievance_events_grievance_id` ON `grievance_events` (`grievance_id`);

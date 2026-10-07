CREATE TABLE `crm_activities` (
	`id` text PRIMARY KEY,
	`workspace_id` text NOT NULL,
	`record_id` text,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`author` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_crm_activities_workspace_id_crm_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `crm_workspaces`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `crm_notes` (
	`id` text PRIMARY KEY,
	`workspace_id` text NOT NULL,
	`record_id` text NOT NULL,
	`body` text NOT NULL,
	`author` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_crm_notes_workspace_id_crm_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `crm_workspaces`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_crm_notes_record_id_crm_records_id_fk` FOREIGN KEY (`record_id`) REFERENCES `crm_records`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `crm_records` (
	`id` text PRIMARY KEY,
	`workspace_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`website` text DEFAULT '' NOT NULL,
	`industry` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'lead' NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`close_date` text DEFAULT '' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`company_id` text,
	`contact_id` text,
	`deal_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_crm_records_workspace_id_crm_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `crm_workspaces`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `crm_workspaces` (
	`id` text PRIMARY KEY,
	`owner_id` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_crm_workspaces_owner_id_user_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `crm_activities_workspace_date` ON `crm_activities` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `crm_notes_workspace_record` ON `crm_notes` (`workspace_id`,`record_id`);--> statement-breakpoint
CREATE INDEX `crm_records_workspace_kind` ON `crm_records` (`workspace_id`,`kind`);
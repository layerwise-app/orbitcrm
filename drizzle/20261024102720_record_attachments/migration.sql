CREATE TABLE `crm_attachments` (
	`id` text PRIMARY KEY,
	`workspace_id` text NOT NULL,
	`record_id` text NOT NULL,
	`key` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`content_type` text NOT NULL,
	`uploader` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_crm_attachments_workspace_id_crm_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `crm_workspaces`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_crm_attachments_record_id_crm_records_id_fk` FOREIGN KEY (`record_id`) REFERENCES `crm_records`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `crm_attachments_workspace_record` ON `crm_attachments` (`workspace_id`,`record_id`);
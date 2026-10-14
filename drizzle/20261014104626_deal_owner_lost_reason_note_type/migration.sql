ALTER TABLE `crm_notes` ADD `type` text DEFAULT 'note' NOT NULL;--> statement-breakpoint
ALTER TABLE `crm_records` ADD `owner` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `crm_records` ADD `lost_reason` text DEFAULT '' NOT NULL;
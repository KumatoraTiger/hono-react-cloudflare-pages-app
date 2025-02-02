CREATE TABLE `image` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`key` text,
	`createdAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `image_key_unique` ON `image` (`key`);
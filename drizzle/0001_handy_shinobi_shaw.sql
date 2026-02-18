CREATE TABLE `list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`listType` enum('shopping','packing','links','places') NOT NULL,
	`title` varchar(255) NOT NULL,
	`checked` boolean NOT NULL DEFAULT false,
	`url` text,
	`assignees` json,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `list_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `splits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`amount` int NOT NULL,
	`paidBy` varchar(100) NOT NULL,
	`members` json NOT NULL,
	`category` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `splits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`day` int NOT NULL DEFAULT 1,
	`time` varchar(10) DEFAULT '09:00',
	`duration` int DEFAULT 60,
	`category` varchar(50),
	`note` text,
	`address` text,
	`lat` varchar(20),
	`lng` varchar(20),
	`transport` json,
	`reservation` json,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trip_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int,
	`name` varchar(100) NOT NULL,
	`memberRole` enum('owner','editor','viewer') NOT NULL DEFAULT 'editor',
	`isCompanion` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trip_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`date` varchar(64),
	`days` int NOT NULL DEFAULT 1,
	`cover` varchar(10) DEFAULT '✈️',
	`color` varchar(20) DEFAULT '#FFE5EC',
	`country` varchar(10),
	`mapProvider` varchar(20) DEFAULT 'google',
	`budget` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `points` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `streak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastStreakDate` varchar(10);
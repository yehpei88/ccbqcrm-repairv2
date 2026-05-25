CREATE TABLE `autoReminder` (
	`id` varchar(64) NOT NULL,
	`minsuId` varchar(64) NOT NULL,
	`staffId` varchar(64) NOT NULL,
	`reminderType` enum('follow_up','missed_call','high_heat') NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autoReminder_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contactLog` (
	`id` varchar(64) NOT NULL,
	`minsuId` varchar(64) NOT NULL,
	`staffId` varchar(64) NOT NULL,
	`callResult` enum('agreed','hesitating','rejected','invalid','closed','missed') NOT NULL,
	`intentLabel` enum('hot','inquiring','rejected','seen') DEFAULT 'seen',
	`lineId` varchar(100),
	`quickTags` json DEFAULT ('[]'),
	`note` text,
	`followUpDays` int,
	`followUpDate` timestamp,
	`aiSummary` text,
	`aiIntentClassification` enum('hot','inquiring','rejected','seen') DEFAULT 'seen',
	`aiConfidence` decimal(3,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contactLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `minsu` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`area` varchar(50) NOT NULL,
	`pinStatus` enum('red-star','red','green','purple','gold') NOT NULL DEFAULT 'red',
	`aiScore` decimal(3,1) DEFAULT '0',
	`callResult` enum('agreed','hesitating','rejected','invalid','closed','missed'),
	`intentLabel` enum('hot','inquiring','rejected','seen') DEFAULT 'seen',
	`cooperationCount` int DEFAULT 0,
	`lastCoopDate` timestamp,
	`totalRevenue` decimal(12,2) DEFAULT '0',
	`hasRainShelter` boolean DEFAULT false,
	`isPackage` boolean DEFAULT false,
	`distanceFromCity` decimal(5,2) DEFAULT '0',
	`note` text,
	`lineAdded` boolean DEFAULT false,
	`lineId` varchar(100),
	`quickTags` json DEFAULT ('[]'),
	`rfmR` int,
	`rfmF` int,
	`rfmM` int,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`missedCallDate` timestamp,
	`missedCallRemindDays` int DEFAULT 7,
	`phoneStatus` enum('pending','confirmed') DEFAULT 'pending',
	`assignedStaffId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `minsu_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`userId` int,
	`assignedAreas` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_id` PRIMARY KEY(`id`)
);

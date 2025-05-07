CREATE TABLE `Conversations` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `createdAt` INTEGER NOT NULL,
  `lastMessageAt` INTEGER NOT NULL
);

CREATE TABLE `Messages` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `conversationId` TEXT NOT NULL,
  `createdAt` INTEGER NOT NULL,
  `content` TEXT NOT NULL,
  `role` TEXT NOT NULL, -- 'user' or 'assistant' (system prompt is not saved)
  FOREIGN KEY (`conversationId`) REFERENCES `Conversations` (`id`)
);
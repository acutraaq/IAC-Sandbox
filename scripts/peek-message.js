// peek-message.js — one-off diagnostic to check raw queue message content
// Run: node peek-message.js
// Requires: AZURE_STORAGE_CONNECTION_STRING env var

import { QueueServiceClient } from "@azure/storage-queue";

const cs = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!cs) {
  console.error("Set AZURE_STORAGE_CONNECTION_STRING env var");
  process.exit(1);
}

const client = QueueServiceClient.fromConnectionString(cs);
const queue = client.getQueueClient("deployment-jobs");

async function main() {
  await queue.createIfNotExists();
  const props = await queue.getProperties();
  console.log(`Queue: deployment-jobs, messages: ${props.approximateMessagesCount}`);

  if (props.approximateMessagesCount === 0) {
    console.log("Queue is empty.");
    return;
  }

  // Peek at up to 5 messages without removing them
  const response = await queue.peekMessages({ numberOfMessages: 5 });
  for (const msg of response.peekedMessageItems) {
    const body = msg.messageText;
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(body) && body.length % 4 === 0;
    console.log(`\nMessage ID: ${msg.messageId}`);
    console.log(`  Inserted: ${msg.insertedOn}`);
    console.log(`  Looks like base64: ${isBase64}`);
    if (isBase64) {
      try {
        const decoded = Buffer.from(body, "base64").toString("utf-8");
        console.log(`  Decoded preview: ${decoded.slice(0, 200)}`);
      } catch {
        console.log(`  Failed to decode as base64`);
      }
    } else {
      console.log(`  Raw preview: ${body.slice(0, 200)}`);
    }
  }
}

main().catch(console.error);

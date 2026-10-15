import { client, db } from "../src/db.ts";

console.log(`Clearing database: ${db.databaseName}`);

await db.collection("posting.posts").deleteMany({});
await db.collection("tagging.tags").deleteMany({});
await db.collection("tagging.tagAssignments").deleteMany({});

// Remove the old indexes too so Tagging can recreate the new
// normalizedName/category unique index.
await db.collection("tagging.tags").dropIndexes();
await db.collection("tagging.tagAssignments").dropIndexes();

console.log("Development data cleared.");

await client.close();
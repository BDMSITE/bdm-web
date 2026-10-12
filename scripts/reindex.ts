import "dotenv/config";
import { reindexAll } from "../src/lib/search";

/* Réindexation complète Meilisearch : pnpm search:reindex */

reindexAll()
  .then((r) => {
    console.log(`Réindexé : ${r.contents} contenus, ${r.profiles} profils.`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

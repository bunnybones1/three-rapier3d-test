import { openDB, IDBPDatabase } from "idb";

class DBManager {
  ready = false;
  db: Promise<IDBPDatabase<unknown>>;
  constructor() {
    this.db = new Promise<IDBPDatabase<unknown>>((resolve) => {
      // deleteDB("densityChunks");
      openDB("densityChunks", undefined, {
        upgrade(db, oldVersion, newVersion, transaction, event) {
          void oldVersion
          void newVersion
          void transaction
          void event
          const objectStore = db.createObjectStore("worldDensities");
          objectStore.createIndex("densityData", "densityData", {
            unique: false,
          });
        },
        blocked(currentVersion, blockedVersion, event) {
          void currentVersion
          void blockedVersion
          void event
          debugger;
        },
        blocking(currentVersion, blockedVersion, event) {
          void currentVersion
          void blockedVersion
          void event
          debugger;
        },
        terminated() {
          debugger;
        },
      }).then((db) => {
        this.ready = true;
        resolve(db);
      });
    });
  }
}
let dbManager: DBManager | undefined;
export function getDBManager() {
  if (!dbManager) {
    dbManager = new DBManager();
  }
  return dbManager!;
}

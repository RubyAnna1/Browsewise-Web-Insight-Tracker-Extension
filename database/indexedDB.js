const dbName = "WebInsightDB";
const dbVersion = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (e) => {
            let db = e.target.result;
            if (!db.objectStoreNames.contains("usage")) {
                const store = db.createObjectStore("usage", { keyPath: "id", autoIncrement: true });
                store.createIndex("byDate", "date", { unique: false });
                store.createIndex("byDomain", "domain", { unique: false });
            }
        };

        request.onsuccess = (e) => {
            resolve(e.target.result);
        };

        request.onerror = (e) => {
            console.error("IndexedDB Error:", e.target.error);
            reject(e.target.error);
        };
    });
}

function saveUsage(domain, timeSpent) {
    openDB().then(db => {
        const tx = db.transaction("usage", "readwrite");
        const store = tx.objectStore("usage");
        store.add({ domain, timeSpent, date: new Date().toISOString() });
    });
}


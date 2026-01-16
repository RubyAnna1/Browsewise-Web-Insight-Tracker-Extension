let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (e) => {
            let db = e.target.result;
            if (!db.objectStoreNames.contains("usage")) {
                const store = db.createObjectStore("usage", { keyPath: "id", autoIncrement: true });
                store.createIndex("byDate", "date", { unique: false }); 
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        request.onerror = (e) => {
            console.error("IndexedDB Error:", e.target.error);
            reject(e.target.error);
        };
    });
}


function saveUsage(domain, timeSpent) {
    openDB().then(db => {
        const transaction = db.transaction("usage", "readwrite");
        const store = transaction.objectStore("usage");
        
        const entry = {
            date: new Date().toISOString(),  // Correct date format
            domain: domain,                // Correct website domain
            timeSpent: timeSpent             // Correct time spent
        };

        store.add(entry);

        transaction.oncomplete = () => console.log(`Saved usage for ${website}`);
        transaction.onerror = (event) => console.error("Error saving data:", event.target.error);
    }).catch(error => console.error("DB Open Error:", error));
}




function getUsage(callback) {
    openDB().then(db => {
        const transaction = db.transaction("usage", "readonly");
        const store = transaction.objectStore("usage");
        const request = store.getAll();

        request.onsuccess = () => {
            console.log("Fetched usage data:", request.result); // Debugging
            callback(request.result);
        };

        request.onerror = (event) => console.error("Fetch error:", event.target.error);
    }).catch(error => console.error("DB Open Error:", error));
}


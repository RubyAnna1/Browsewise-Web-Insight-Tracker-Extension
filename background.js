let activeTab = null;
let startTime = null;

// ✅ Function to get the active tab
function getActiveTab(callback) {
    chrome.windows.getLastFocused({ populate: true }, (window) => {
        if (!window || !window.tabs) return;
        let activeTab = window.tabs.find(tab => tab.active);
        if (activeTab) callback(activeTab);
    });
}

// ✅ Function to track website usage
function trackTime() {
    getActiveTab((tab) => {
        if (!tab || !tab.url || !tab.url.startsWith("http")) return; // Prevent errors on invalid URLs
        
        const url = new URL(tab.url);
        const domain = url.hostname;

        if (activeTab !== domain) {
            if (activeTab && startTime) {
                let timeSpent = Math.floor((Date.now() - startTime) / 1000);
                saveUsage(activeTab, timeSpent); // Save to IndexedDB
            }
            activeTab = domain;
            startTime = Date.now();
        }
    });
}

// ✅ Function to store website time in local storage (For Quick Access)
function saveTime(domain, seconds) {
    chrome.storage.local.get(["websiteData"], (data) => {
        let websiteData = data.websiteData || {};

        if (!websiteData[domain]) {
            websiteData[domain] = 0;
        }
        websiteData[domain] += seconds;

        chrome.storage.local.set({ websiteData });
    });
}

// ✅ Function to calculate total time spent today
function calculateTotalTime() {
    chrome.storage.local.get(["websiteData"], (data) => {
        let totalSeconds = 0;
        if (data.websiteData) {
            totalSeconds = Object.values(data.websiteData).reduce((acc, cur) => acc + cur, 0);
        }
        chrome.storage.local.set({ totalTimeToday: totalSeconds });
    });
}

// ✅ Function to determine the most visited site
function determineMostVisited() {
    chrome.storage.local.get(["websiteData"], (data) => {
        let mostVisited = { domain: "None", time: 0 };

        if (data.websiteData) {
            for (let domain in data.websiteData) {
                if (data.websiteData[domain] > mostVisited.time) {
                    mostVisited = { domain, time: data.websiteData[domain] };
                }
            }
        }

        chrome.storage.local.set({ mostVisitedSite: mostVisited });
    });
}

async function saveUsage(domain, timeSpent) { // Use `domain` consistently
    console.log("Saving:", domain, timeSpent);
    openDB().then(db => {
        const tx = db.transaction("usage", "readwrite");
        const store = tx.objectStore("usage");

        const entry = {
            date: new Date().toISOString(),
            domain,  // Keep it consistent
            timeSpent
        };

        const request = store.add(entry);
        request.onsuccess = () => console.log("Saved entry:", entry);
        request.onerror = (e) => console.error("Failed to save:", e.target.error);
    });
}



// ✅ Run tracking functions every 5 seconds
setInterval(() => {
    trackTime();
    calculateTotalTime();
    determineMostVisited();
}, 5000);


// ✅ Fix: Add event listener for new tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        trackTime();
    }
});

// ✅ Listen for tab switches
chrome.tabs.onActivated.addListener(() => {
    trackTime();
});

// ✅ Listen for window focus changes
chrome.windows.onFocusChanged.addListener(() => {
    trackTime();
});

// ✅ Load IndexedDB Script (Ensure it’s loaded before usage)
importScripts("database/indexedDB.js");
console.log("indexedDB.js loaded successfully");

// ✅ Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateBlocking") {
        updateBlockingRules(message.sites);
    } else if (message.action === "startTimer") {
        if (message.timeLimit !== undefined) {
            startTimer(message.timeLimit);
        } else {
            console.warn("❌ Missing timeLimit value in startTimer message:", message);
        }
    }
});

function updateBlockingRules(blockedSites) {
    // ✅ First, remove all existing rules
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
        let ruleIds = rules.map(rule => rule.id);

        // ✅ Remove old rules, then add new ones
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds,
            addRules: blockedSites.map((site, index) => ({
                id: 1000 + index,
                priority: 1,
                action: { type: "block" },
                condition: {
                    urlFilter: `||${site}^`, // ✅ Correct format for blocking
                    resourceTypes: ["main_frame"]
                }
            }))
        }, () => {
            console.log("✅ Blocking rules updated:", blockedSites);
        });
    });
}

// ✅ Load Focus Mode settings on startup
chrome.storage.local.get(["focusMode", "blockedSites"], (data) => {
    if (data.focusMode) {
        console.log("✅ Focus Mode is ON. Restoring blocking...");
        updateBlockingRules(data.blockedSites || []);
    } else {
        console.log("❌ Focus Mode is OFF.");
    }
});




let timeLimit = 0;
let remainingTime = 0;
let timerInterval = null;

// ⏳ Load saved time limit and start timer if set
chrome.storage.local.get(["timeLimit"], (data) => {
    if (data.timeLimit && data.timeLimit > 0) {
        timeLimit = data.timeLimit;
        remainingTime = timeLimit;
        startTimer();
    }
});

// ✅ Function to Start Timer
function startTimer() {
    if (timerInterval) clearInterval(timerInterval); // Prevent duplicate timers

    timerInterval = setInterval(() => {
        remainingTime--;

        // 🔄 Update time in storage for the popup
        chrome.storage.local.set({ remainingTime });

        // 🚨 Time is up!
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            chrome.storage.local.set({ remainingTime: 0 });

            // 📩 Send message to play alarm & show pop-up
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: playAlarmSound
                    });
                }
            });

            // 🔔 Show a Chrome Notification
            chrome.notifications.create({
                type: "basic",
                iconUrl: "assets/icons/icon.png",
                title: "Time's Up!",
                message: "⏰ You've reached your browsing limit!",
                priority: 2
            });

            // 📩 Send message to popup script
            chrome.runtime.sendMessage({ action: "timeUp" });
        }
    }, 1000);
}

// ✅ Function to Play Alarm Sound (Injected into Page)
function playAlarmSound() {
    let alarmAudio = new Audio(chrome.runtime.getURL("assets/alarm.mp3"));
    alarmAudio.play();
}

// 📩 Listen for Popup Messages
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "startTimer") {
        timeLimit = message.timeLimit;
        remainingTime = timeLimit;
        chrome.storage.local.set({ timeLimit, remainingTime });
        startTimer();
    } else if (message.action === "stopTimer") {
        clearInterval(timerInterval);
        chrome.storage.local.set({ remainingTime: 0 });
    }
});

let blockedAdsCount = 0;
let customFilters = [];

// Set up listener for enabling/disabling the ad blocker
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["adBlockerEnabled", "blockedAds", "customFilters"], (data) => {
        blockedAdsCount = data.blockedAds || 0;
        customFilters = data.customFilters || [];

        // Set default state of ad blocker
        const adBlockerEnabled = data.adBlockerEnabled || false;
        chrome.storage.local.set({ adBlockerEnabled });

        // Initialize ad blocking functionality if enabled
        if (adBlockerEnabled) {
            startAdBlocker(customFilters);
        }
    });
});

// Start the ad blocking process when enabled
function startAdBlocker(filters) {
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete") {
            applyAdBlocker(tabId, filters);
        }
    });
}

// Apply custom ad blocking rules to a specific tab
function applyAdBlocker(tabId, filters) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: blockAds,
        args: [filters],
    });
}

// Block ads based on filters
function blockAds(filters) {
    const adSelectors = [
        "iframe[src*='ads']", 
        "div[class*='ad']",
        "div[id*='ad']",
        "ins.adsbygoogle"
    ];

    // Add custom filters to selectors
    filters.forEach((filter) => {
        adSelectors.push(`iframe[src*='${filter}']`);
        adSelectors.push(`div[class*='${filter}']`);
        adSelectors.push(`div[id*='${filter}']`);
    });

    // Remove ads
    adSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((ad) => ad.remove());
    });

    // Increment blocked ad count
    chrome.runtime.sendMessage({ action: "incrementBlockedAds" });
}

// Listen for messages to update the blocked ad count
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "incrementBlockedAds") {
        blockedAdsCount++;
        chrome.storage.local.set({ blockedAds: blockedAdsCount });
    }
});
// Productivity Tracker - Background Script
let activeTab = null;
let startTime = null;
let siteTime = {}; // Stores time spent per site
let dailyLimits = {}; // Stores daily limits for each site

// Load stored data on extension startup
chrome.storage.local.get(["siteTime", "dailyLimits"], (data) => {
  siteTime = data.siteTime || {};
  dailyLimits = data.dailyLimits || {};
});

// Function to update time spent on active site
function updateTimeSpent() {
  if (!activeTab || !startTime) return;

  const url = new URL(activeTab);
  if (!url.hostname || url.hostname === "newtab") return; // Ignore New Tab and blank URLs

  const endTime = Date.now();
  const timeSpent = (endTime - startTime) / 1000; // Convert to seconds
  const domain = url.hostname;

  siteTime[domain] = (siteTime[domain] || 0) + timeSpent;
  startTime = Date.now(); // Reset start time

  // Save updated time data
  chrome.storage.local.set({ siteTime });

  // 🚀 Notify if time limit exceeded
  if (dailyLimits[domain] && siteTime[domain] >= dailyLimits[domain]) {
    notifyLimitExceeded(domain);
  }
}

// Function to notify user when limit is exceeded
function notifyLimitExceeded(domain) {
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "./icons/icons-alert.png", // Make sure this file exists!
      title: "Time Limit Reached",
      message: `You've reached your daily limit for ${domain}.`,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("Notification Error:", chrome.runtime.lastError);
      }
    }
  );
}

// Function to handle tab activation
function handleTabActivated(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab || !tab.url) return;
    if (tab.url.startsWith("chrome://") || tab.url === "about:blank") return; // Ignore new tabs

    updateTimeSpent();
    activeTab = tab.url;
    startTime = Date.now();
  });
}

// Function to handle tab updates (URL changes)
function handleTabUpdated(tabId, changeInfo, tab) {
  if (!tab.url || tab.url.startsWith("chrome://") || tab.url === "about:blank") return;

  if (changeInfo.status === "complete") {
    updateTimeSpent();
    activeTab = tab.url;
    startTime = Date.now();
  }
}

// Function to handle browser idle state
function handleIdleStateChange(state) {
  if (state === "idle" || state === "locked") {
    updateTimeSpent();
    activeTab = null;
  } else if (state === "active" && activeTab) {
    startTime = Date.now();
  }
}

// Register the event listeners
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.idle.onStateChanged.addListener(handleIdleStateChange);

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTimeSpent") {
    sendResponse({ siteTime, dailyLimits });
  } else if (message.action === "resetTime") {
    siteTime = {};
    chrome.storage.local.set({ siteTime });
    sendResponse({ success: true });
  } else if (message.action === "setDailyLimit") {
    dailyLimits[message.domain] = message.limit;
    
    // Save updated limits to storage
    chrome.storage.local.set({ dailyLimits }, () => {
      sendResponse({ success: true });
    });

    return true; // Ensure async response works
  }
});

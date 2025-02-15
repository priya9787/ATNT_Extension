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




//Tab Manager
const categories = {
    "Social Media": ["facebook.com", "twitter.com", "instagram.com", "linkedin.com", "tiktok.com"],
    "Work": ["mail.google.com", "slack.com", "notion.so", "docs.google.com", "jira.com"],
    "News": ["bbc.com", "cnn.com", "nytimes.com", "theguardian.com"]
  };
  
  // Function to categorize open tabs
 // Function to categorize open tabs
function categorizeTabs(callback) {
    chrome.tabs.query({}, (tabs) => {
      let categorizedTabs = {
        "Social Media": [],
        "Work": [],
        "News": [],
        "Other": []
      };
  
      tabs.forEach((tab) => {
        if (!tab.url) return; // Skip tabs with undefined URL
  
        let matched = false;
  
        for (const [category, sites] of Object.entries(categories)) {
          if (sites.some((site) => tab.url.includes(site))) {
            categorizedTabs[category].push({ id: tab.id, url: tab.url, title: tab.title });
            matched = true;
            break;
          }
        }
  
        if (!matched) {
          categorizedTabs["Other"].push({ id: tab.id, url: tab.url, title: tab.title });
        }
      });
  
      callback(categorizedTabs);
    });
  }
  
  // Listen for popup requests
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCategorizedTabs") {
      categorizeTabs(sendResponse);
      return true; // Keep the message channel open for async response
    }
  
    if (request.action === "saveSession") {
      chrome.storage.local.set({ savedSession: request.session }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
  
    if (request.action === "restoreSession") {
      chrome.storage.local.get(["savedSession"], (data) => {
        if (data.savedSession) {
          data.savedSession.forEach((tab) => {
            chrome.tabs.create({ url: tab.url });
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      });
      return true;
    }
  });
  

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

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
  if (!url.hostname || url.hostname === "newtab") return;

  const endTime = Date.now();
  const timeSpent = (endTime - startTime) / 1000;
  const domain = url.hostname;

  siteTime[domain] = (siteTime[domain] || 0) + timeSpent;
  startTime = Date.now();

  chrome.storage.local.set({ siteTime });

  console.log(`Time spent on ${domain}: ${siteTime[domain]} seconds`);
  console.log(`Daily limit for ${domain}: ${dailyLimits[domain]} seconds`);

  if (dailyLimits[domain] && siteTime[domain] >= dailyLimits[domain]) {
    console.log(`Limit exceeded for ${domain}. Notifying user...`);
    notifyLimitExceeded(domain);
  }
}

function notifyLimitExceeded(domain) {
  console.log(`Creating notification for ${domain}`);
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Time Limit Reached",
      message: `You've reached your daily limit for ${domain}.`,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("Notification Error:", chrome.runtime.lastError);
      } else {
        console.log("Notification shown successfully:", notificationId);
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




//Tab Manager
const categories = {
    "Social Media": ["facebook.com", "twitter.com", "instagram.com", "linkedin.com", "tiktok.com"],
    "Work": ["mail.google.com", "slack.com", "notion.so", "docs.google.com", "jira.com"],
    "News": ["bbc.com", "cnn.com", "nytimes.com", "theguardian.com"],
    "Shopping": ["amazon.in", "ebay.com", "walmart.com", "target.com","flipkart.com"],
  };
  
  // Function to categorize open tabs
 // Function to categorize open tabs
function categorizeTabs(callback) {
    chrome.tabs.query({}, (tabs) => {
      let categorizedTabs = {
        "Social Media": [],
        "Work": [],
        "News": [],
        "Shopping": [],
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
  



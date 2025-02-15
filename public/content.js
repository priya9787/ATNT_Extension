chrome.storage.local.get(["adBlockerEnabled", "customFilters"], (data) => {
    if (data.adBlockerEnabled) {
        blockAds(data.customFilters || []);
    }
});

// Block ads based on custom filters
function blockAds(customFilters) {
    const adSelectors = [
        "iframe[src*='ads']", 
        "div[class*='ad']",
        "div[id*='ad']",
        "ins.adsbygoogle"
    ];

    customFilters.forEach((filter) => {
        adSelectors.push(`iframe[src*='${filter}']`);
        adSelectors.push(`div[class*='${filter}']`);
        adSelectors.push(`div[id*='${filter}']`);
    });

    // Remove existing ads
    adSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((ad) => ad.remove());
    });

    // Listen for new ads and remove them
    const observer = new MutationObserver(() => {
        adSelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((ad) => ad.remove());
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Send blocked ad count update to background.js
    chrome.runtime.sendMessage({ action: "incrementBlockedAds" });
}

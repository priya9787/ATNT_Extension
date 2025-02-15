import React, { useState, useEffect } from "react";

const AdBlocker = () => {
  const [enabled, setEnabled] = useState(false);
  const [blockedAds, setBlockedAds] = useState(0);
  const [customFilters, setCustomFilters] = useState([]);
  const [newFilter, setNewFilter] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["adBlockerEnabled", "blockedAds", "customFilters"], (data) => {
      setEnabled(data.adBlockerEnabled || false);
      setBlockedAds(data.blockedAds || 0);
      setCustomFilters(data.customFilters || []);
    });
  }, []);

  const toggleAdBlocker = () => {
    const newState = !enabled;
    setEnabled(newState);
    chrome.storage.local.set({ adBlockerEnabled: newState });

    // Reload current tab to apply ad-blocking
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  };

  const addCustomFilter = () => {
    if (newFilter.trim() !== "") {
      const updatedFilters = [...customFilters, newFilter.trim()];
      setCustomFilters(updatedFilters);
      chrome.storage.local.set({ customFilters: updatedFilters });
      setNewFilter("");
      chrome.tabs.reload();
    }
  };

  const removeCustomFilter = (filterToRemove) => {
    const updatedFilters = customFilters.filter((filter) => filter !== filterToRemove);
    setCustomFilters(updatedFilters);
    chrome.storage.local.set({ customFilters: updatedFilters });
    chrome.tabs.reload();
  };

  return (
    <div className="ad-blocker-container">
      <h3>Ad Blocker</h3>
      <button onClick={toggleAdBlocker}>{enabled ? "Disable" : "Enable"}</button>
      <p>Blocked Ads: {blockedAds}</p>

      <h4>Custom Filters</h4>
      <input
        type="text"
        placeholder="Enter domain or keyword"
        value={newFilter}
        onChange={(e) => setNewFilter(e.target.value)}
      />
      <button onClick={addCustomFilter}>Add Filter</button>

      <ul>
        {customFilters.map((filter, index) => (
          <li key={index}>
            {filter}
            <button onClick={() => removeCustomFilter(filter)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdBlocker;


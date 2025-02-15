import React, { useState, useEffect } from "react";

const TabManager = () => {
  const [categorizedTabs, setCategorizedTabs] = useState({});
  const [savedSession, setSavedSession] = useState([]);

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getCategorizedTabs" }, (response) => {
      setCategorizedTabs(response || {});
    });

    chrome.storage.local.get(["savedSession"], (data) => {
      setSavedSession(data.savedSession || []);
    });
  }, []);

  const saveSession = () => {
    chrome.runtime.sendMessage({ action: "saveSession", session: Object.values(categorizedTabs).flat() }, (response) => {
      if (response.success) {
        setSavedSession(Object.values(categorizedTabs).flat());
      }
    });
  };

  const restoreSession = () => {
    chrome.runtime.sendMessage({ action: "restoreSession" }, (response) => {
      if (response.success) {
        alert("Session Restored!");
      } else {
        alert("No session saved!");
      }
    });
  };

  return (
    <div>
      <h3>Tab Manager</h3>

      <button onClick={saveSession}>Save Session</button>
      <button onClick={restoreSession}>Restore Session</button>

      {Object.entries(categorizedTabs).map(([category, tabs]) => (
        <div key={category}>
          <h4>{category} ({tabs.length})</h4>
          <ul>
            {tabs.map((tab) => (
              <li key={tab.id}>
                <a href={tab.url} target="_blank" rel="noopener noreferrer">
                  {tab.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h4>Saved Session</h4>
      <ul>
        {savedSession.map((tab, index) => (
          <li key={index}>
            <a href={tab.url} target="_blank" rel="noopener noreferrer">
              {tab.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabManager;

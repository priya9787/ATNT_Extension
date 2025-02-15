import React from "react";

const TabManager = () => {
  const groupTabs = async () => {
    const tabs = await chrome.tabs.query({});
    const categories = { Social: [], Work: [], News: [] };

    tabs.forEach((tab) => {
      if (tab.url.includes("facebook") || tab.url.includes("twitter")) {
        categories.Social.push(tab.id);
      } else if (tab.url.includes("gmail") || tab.url.includes("docs")) {
        categories.Work.push(tab.id);
      } else {
        categories.News.push(tab.id);
      }
    });

    Object.values(categories).forEach((group) => {
      if (group.length > 0) {
        chrome.tabs.group({ tabIds: group });
      }
    });
  };

  return (
    <div>
      <h3>Tab Manager</h3>
      <button onClick={groupTabs}>Group Tabs</button>
    </div>
  );
};

export default TabManager;

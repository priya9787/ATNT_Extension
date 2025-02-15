import React, { useState, useEffect } from "react";

const ProductivityTracker = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    chrome.storage.local.get(["timeSpent"], (data) => {
      setStats(data.timeSpent || {});
    });
  }, []);

  return (
    <div>
      <h3>Productivity Tracker</h3>
      <ul>
        {Object.entries(stats).map(([site, time]) => (
          <li key={site}>{site}: {time} mins</li>
        ))}
      </ul>
    </div>
  );
};

export default ProductivityTracker;

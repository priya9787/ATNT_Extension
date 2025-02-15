import React, { useState, useEffect } from "react";

const ProductivityTracker = () => {
  const [siteTime, setSiteTime] = useState({});
  const [dailyLimits, setDailyLimits] = useState({});
  const [newLimit, setNewLimit] = useState({});

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getTimeSpent" }, (response) => {
      if (response) {
        setSiteTime(response.siteTime || {});
        setDailyLimits(response.dailyLimits || {});
      }
    });
  }, []);
  const handleSetLimit = (domain) => {
    const limit = parseInt(newLimit[domain], 10);
    if (!limit || limit <= 0) return;
  
    chrome.runtime.sendMessage(
      { action: "setDailyLimit", domain, limit },
      (response) => {
        if (response && response.success) {
          setDailyLimits((prev) => ({ ...prev, [domain]: limit }));
          setNewLimit((prev) => ({ ...prev, [domain]: "" })); // Reset input field
  
          // Show confirmation
          alert(`Daily limit set for ${domain}: ${limit} seconds`);
        }
      }
    );
  };
  
  const handleReset = () => {
    chrome.runtime.sendMessage({ action: "resetTime" }, (response) => {
      if (response.success) {
        setSiteTime({});
      }
    });
  };

  return (
    <div>
      <h3>Time Spent on Sites</h3>
      <table>
        <thead>
          <tr>
            <th>Website</th>
            <th>Time (s)</th>
            <th>Daily Limit (s)</th>
            <th>Set Limit</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(siteTime).map(([domain, time]) => (
            <tr key={domain}>
              <td>{domain}</td>
              <td>{Math.round(time)}</td>
              <td>{dailyLimits[domain] || "Not Set"}</td>
              <td>
                <input
                  type="number"
                  value={newLimit[domain] || ""}
                  onChange={(e) =>
                    setNewLimit((prev) => ({
                      ...prev,
                      [domain]: e.target.value,
                    }))
                  }
                />
                <button
                  onClick={() => handleSetLimit(domain)}
                  disabled={!newLimit[domain] || isNaN(newLimit[domain])}
                >
                  Set
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleReset}>Reset Time</button>
    </div>
  );
};

export default ProductivityTracker;

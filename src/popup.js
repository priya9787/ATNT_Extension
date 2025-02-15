import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import AdBlocker from "./components/AdBlocker";
import ProductivityTracker from "./components/ProductivityTracker";
import Notes from "./components/Notes";
import TabManager from "./components/TabManager";
import "./styles.css";

const Popup = () => {
  const [activeTab, setActiveTab] = useState("adBlocker");

  return (
    <div style={{ width: 350, padding: 10, backgroundColor: "#1a1a1a", color: "#ffffff" }}>
      <h2>Multi-Purpose Chrome Extension</h2>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={activeTab === "adBlocker" ? "active" : ""}
          onClick={() => setActiveTab("adBlocker")}
        >
          Ad Blocker
        </button>
        <button
          className={activeTab === "tracker" ? "active" : ""}
          onClick={() => setActiveTab("tracker")}
        >
          Tracker
        </button>
        <button
          className={activeTab === "notes" ? "active" : ""}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
        <button
          className={activeTab === "tabManager" ? "active" : ""}
          onClick={() => setActiveTab("tabManager")}
        >
          Tab Manager
        </button>
      </div>

      {/* Components */}
      <div className={`component-container ${activeTab === "adBlocker" ? "active" : ""}`}>
        <AdBlocker />
      </div>
      <div className={`component-container ${activeTab === "tracker" ? "active" : ""}`}>
        <ProductivityTracker />
      </div>
      <div className={`component-container ${activeTab === "notes" ? "active" : ""}`}>
        <Notes />
      </div>
      <div className={`component-container ${activeTab === "tabManager" ? "active" : ""}`}>
        <TabManager />
      </div>
    </div>
  );
};

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(<Popup />);
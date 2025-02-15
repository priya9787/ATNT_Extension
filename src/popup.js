import React from "react";
import { createRoot } from "react-dom/client";
import AdBlocker from "./components/AdBlocker";
import ProductivityTracker from "./components/ProductivityTracker";  // Import Tracker
import Notes from "./components/Notes";

const Popup = () => {
  return (
    <div style={{ width: 300, padding: 10 }}>
      <h2>Super Productivity Extension</h2>
      <AdBlocker />
      <ProductivityTracker />  {/* Include Tracker */}
      <Notes />
    </div>
  );
};

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(<Popup />);

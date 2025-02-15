import React, { useState, useEffect } from "react";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [currentTabUrl, setCurrentTabUrl] = useState("");

  // Fetch the current tab's URL using Chrome Tabs API
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setCurrentTabUrl(url.href); // Set the full URL of the current tab
      }
    });
  }, []);

  // Load notes from localStorage and filter by current tab's URL
  useEffect(() => {
    if (!currentTabUrl) return; // Wait until the URL is fetched

    const storedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    const filteredNotes = storedNotes.filter(
      (note) => note.page === currentTabUrl || note.page === "global"
    );
    setNotes(filteredNotes);
  }, [currentTabUrl]); // Reload notes when the tab URL changes

  // Save notes to localStorage
  const saveNotes = (updatedNotes) => {
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
    setNotes(updatedNotes.filter((note) => note.page === "global" || note.page === currentTabUrl));
  };

  // Add a new note (Global or Local)
  const addNote = (isGlobal = false) => {
    if (!input.trim()) return;

    const newNote = {
      id: Date.now(),
      text: input,
      page: isGlobal ? "global" : currentTabUrl, // Use current tab's URL for local notes
    };

    const storedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    const updatedNotes = [...storedNotes, newNote];

    localStorage.setItem("notes", JSON.stringify(updatedNotes)); // Save to localStorage
    setNotes(updatedNotes.filter((note) => note.page === currentTabUrl || note.page === "global")); // Update state

    setInput(""); // Clear input
  };

  // Delete a note
  const deleteNote = (id) => {
    const updatedNotes = JSON.parse(localStorage.getItem("notes")).filter((note) => note.id !== id);
    saveNotes(updatedNotes);
  };

  // Start editing a note
  const startEditing = (id, text) => {
    setEditingId(id);
    setEditInput(text);
  };

  // Update a note
  const updateNote = () => {
    const updatedNotes = JSON.parse(localStorage.getItem("notes")).map((note) =>
      note.id === editingId ? { ...note, text: editInput } : note
    );
    saveNotes(updatedNotes);
    setEditingId(null);
    setEditInput("");
  };

  // Categorize Notes
  const localNotes = notes.filter((note) => note.page === currentTabUrl);
  const globalNotes = notes.filter((note) => note.page === "global");

  return (
    <div style={{ padding: "20px", width: "350px" }}>
      <h3>Notes for {currentTabUrl || "Current Tab"}</h3>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Write a note..."
      />
      <button onClick={() => addNote(false)}>Add Local</button>
      <button onClick={() => addNote(true)}>Add Global</button>

      {/* Global Notes */}
      {globalNotes.length > 0 && (
        <div>
          <h4>🌍 Global Notes</h4>
          <ul>
            {globalNotes.map((note) => (
              <li key={note.id}>
                {editingId === note.id ? (
                  <>
                    <input value={editInput} onChange={(e) => setEditInput(e.target.value)} />
                    <button onClick={updateNote}>Save</button>
                  </>
                ) : (
                  <>
                    {note.text} <strong>(Global)</strong>
                    <button onClick={() => startEditing(note.id, note.text)}>Edit</button>
                    <button onClick={() => deleteNote(note.id)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Local Notes */}
      {localNotes.length > 0 && (
        <div>
          <h4>📌 Local Notes</h4>
          <ul>
            {localNotes.map((note) => (
              <li key={note.id}>
                {editingId === note.id ? (
                  <>
                    <input value={editInput} onChange={(e) => setEditInput(e.target.value)} />
                    <button onClick={updateNote}>Save</button>
                  </>
                ) : (
                  <>
                    {note.text}
                    <button onClick={() => startEditing(note.id, note.text)}>Edit</button>
                    <button onClick={() => deleteNote(note.id)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Notes;
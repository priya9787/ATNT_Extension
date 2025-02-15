import React, { useState, useEffect } from "react";

const Notes = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    chrome.storage.local.get(["notes"], (data) => {
      setNotes(data.notes || []);
    });
  }, []);

  const addNote = () => {
    const newNote = prompt("Enter your note:");
    if (newNote) {
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      chrome.storage.local.set({ notes: updatedNotes });
    }
  };

  return (
    <div>
      <h3>Smart Notes</h3>
      <button onClick={addNote}>Add Note</button>
      <ul>
        {notes.map((note, idx) => (
          <li key={idx}>{note}</li>
        ))}
      </ul>
    </div>
  );
};

export default Notes;

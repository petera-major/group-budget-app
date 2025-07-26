import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "./CreateGroup.css";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const navigate = useNavigate();

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    const currentUser = auth.currentUser;
    if (!currentUser) return alert("You must be logged in");

    const groupId = uuidv4().slice(0, 8);
    const groupCode = groupId.toUpperCase();

    try {
      await setDoc(doc(db, "groups", groupId), {
        name: groupName,
        groupCode,
        createdBy: currentUser.uid,
        members: [currentUser.uid],
      });

      await setDoc(doc(db, "users", currentUser.uid), {
        email: currentUser.email,
        groupId: groupId,
      });

      navigate(`/group/${groupId}`);
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Something went wrong!");
    }
  };

  return (
    <div className="create-group-form">
      <h2>Create a Group</h2>
      <form onSubmit={handleCreateGroup}>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
          required
        />
        <button type="submit">Create Group</button>
      </form>
    </div>
  );
}

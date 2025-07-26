import { useState } from "react";
import { db, auth } from "../firebase";
import {collection, query, where, getDocs, doc, updateDoc, setDoc, arrayUnion} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function JoinGroup() {
  const [codeInput, setCodeInput] = useState("");
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("You must be logged in");

    try {
      // this is the query for group code
      const q = query(collection(db, "groups"), where("groupCode", "==", codeInput.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Group not found 😢");
        return;
      }

      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();
      const groupId = groupDoc.id;

      await updateDoc(doc(db, "groups", groupId), {
        members: arrayUnion(currentUser.uid),
      });

      await setDoc(doc(db, "users", currentUser.uid), {
        email: currentUser.email,
        groupId: groupId,
      });

      navigate(`/group/${groupId}`);
    } catch (err) {
      console.error("Error joining group:", err);
      alert("Something went wrong!");
    }
  };

  return (
    <div>
      <h2>Join an Existing Group</h2>
      <form onSubmit={handleJoin}>
        <input
          type="text"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="Enter Group Code"
          required
        />
        <button type="submit">Join Group</button>
      </form>
    </div>
  );
}

  
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);

  const handleLogout = () => {
    signOut(auth);
  };

  const fetchUserGroups = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setGroups(data);
  };

  const handleDeleteGroup = async (groupId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this group? This will also remove all related expenses.");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "groups", groupId));

      const q = query(collection(db, "expenses"), where("groupId", "==", groupId));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map((docRef) => deleteDoc(docRef.ref));
      await Promise.all(deletePromises);

      fetchUserGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/");
      } else {
        fetchUserGroups();
      }
    });

    return unsub;
  }, []);

  return (
    <div className="dashboard-wrapper">
      <h2>Welcome to your Dashboard, {auth.currentUser?.email}</h2>

      <div className="dashboard-buttons">
        <button onClick={() => navigate("/create-group")}>➕ Create Group</button>
        <button onClick={() => navigate("/join-group")}>Join Group</button>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <h3>Your Groups:</h3>
      {groups.length === 0 ? (
        <p>You haven’t joined or created any groups yet!</p>
      ) : (
        <ul>
          {groups.map((group) => (
            <li key={group.id}>
              <span onClick={() => navigate(`/group/${group.id}`)} style={{ cursor: "pointer" }}>
                {group.name} — Code: {group.groupCode}
              </span>
              <button onClick={() => handleDeleteGroup(group.id)} style={{ marginLeft: "10px" }}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

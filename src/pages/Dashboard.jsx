import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
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
        <button onClick={() => navigate("/join-group")}> Join Group</button>
        <button onClick={handleLogout}> Logout</button>
      </div>

      <h3>Your Groups:</h3>
      {groups.length === 0 ? (
        <p>You haven’t joined or created any groups yet!</p>
      ) : (
        <ul>
          {groups.map((group) => (
            <li key={group.id} onClick={() => navigate(`/group/${group.id}`)}>
              {group.name} — Code: {group.groupCode}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

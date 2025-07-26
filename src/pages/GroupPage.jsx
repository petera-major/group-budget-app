import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import {collection, query, where, onSnapshot, addDoc, doc, getDoc, updateDoc, deleteDoc} from "firebase/firestore";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./GroupPage.css";

export default function GroupPage() {
    const { groupId } = useParams();
    const currentUser = auth.currentUser;
    const [groupData, setGroupData] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState({ title: "", amount: "", category: "Other", dueDate: "" });
    const [showOnlyOwed, setShowOnlyOwed] = useState(false);
    const [groupTotals, setGroupTotals] = useState({ total: 0, paid: 0, balance: 0 });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: "", amount: "", dueDate: "", category: "" });

  
    useEffect(() => {
      const fetchGroup = async () => {
        const groupRef = doc(db, "groups", groupId);
        const snap = await getDoc(groupRef);
        if (snap.exists()) setGroupData(snap.data());
      };
      fetchGroup();
    }, [groupId]);
  
    useEffect(() => {
      const q = query(collection(db, "expenses"), where("groupId", "==", groupId));
      const unsub = onSnapshot(q, (snap) => {
        const fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExpenses(fetched);
  
        let total = 0;
        let paid = 0;
  
        fetched.forEach((exp) => {
          const splitCount = exp.splitWith?.length || 1;
          const share = parseFloat(exp.amount) / splitCount;
          total += parseFloat(exp.amount);
  
          Object.entries(exp.paid || {}).forEach(([uid, isPaid]) => {
            if (isPaid) paid += share;
          });
        });
  
        setGroupTotals({
          total,
          paid,
          balance: total - paid,
        });
      });
      return unsub;
    }, [groupId]);
  
    const handleFormChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };

    const startEdit = (exp) => {
        setEditingId(exp.id);
        setEditForm({
            title: exp.title,
            amount: exp.amount,
            dueDate: exp.dueDate,
            category: exp.category || "Other",
        });
      };
  
    const handleAddExpense = async (e) => {
      e.preventDefault();
      if (!currentUser) return;
      const paidStatus = {};
      groupData.members.forEach((uid) => {
        paidStatus[uid] = uid === currentUser.uid;
      });
      await addDoc(collection(db, "expenses"), {
        groupId,
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        dueDate: form.dueDate,
        splitWith: groupData.members,
        paidBy: currentUser.uid,
        paid: paidStatus,
        timestamp: new Date(),
      });
      setForm({ title: "", amount: "", category: "Other", dueDate: "" });
    };
  
    const handleTogglePaid = async (expId, uid, isPaid) => {
      await updateDoc(doc(db, "expenses", expId), {
        [`paid.${uid}`]: isPaid,
      });
    };
  
    const handleDelete = async (id) => {
      await deleteDoc(doc(db, "expenses", id));
    };
  
    const totalOwed = expenses.reduce((sum, exp) => {
      exp.splitWith?.forEach((uid) => {
        if (!exp.paid[uid]) {
          sum += parseFloat(exp.amount) / exp.splitWith.length;
        }
      });
      return sum;
    }, 0);
  
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
    const pieData = {
      labels: ["Paid", "Unpaid"],
      datasets: [
        {
          data: [groupTotals.paid, groupTotals.balance],
          backgroundColor: ["#4ade80", "#f87171"],
        },
      ],
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
      };
      
      const handleSaveEdit = async (id) => {
        await updateDoc(doc(db, "expenses", id), {
          title: editForm.title,
          amount: parseFloat(editForm.amount),
          dueDate: editForm.dueDate,
          category: editForm.category,
        });
        setEditingId(null);
      };      
  
    if (!groupData) return <p>Loading group data...</p>;
  
    return (
      <div className="group-page">
        <h2>{groupData.name}</h2>
        <div className="group-balance-card">
          <h3>Group Balance Overview</h3>
          <p><strong>Total Expenses:</strong> ${groupTotals.total.toFixed(2)}</p>
          <p><strong>Total Paid:</strong> ${groupTotals.paid.toFixed(2)}</p>
          <p><strong>Remaining Balance:</strong> ${groupTotals.balance.toFixed(2)}</p>
        </div>
  
        <h4>Total Group Balance Due: ${totalOwed.toFixed(2)}</h4>
  
        <form className="expense-form" onSubmit={handleAddExpense}>
          <input name="title" value={form.title} onChange={handleFormChange} placeholder="Title" required />
          <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleFormChange} placeholder="Amount" required />
          <input name="dueDate" type="date" value={form.dueDate} onChange={handleFormChange} required />
          <select name="category" value={form.category} onChange={handleFormChange}>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Groceries">Groceries</option>
            <option value="Other">Other</option>
          </select>
          <button type="submit">Add</button>
        </form>
  
        <label>
          <input
            type="checkbox"
            checked={showOnlyOwed}
            onChange={() => setShowOnlyOwed(!showOnlyOwed)}
          />
          Show only unpaid
        </label>
  
        <div className="expense-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Due</th>
                <th>Paid By</th>
                <th>Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.map((exp) => {
                const hasUnpaid = exp.splitWith.some((uid) => !exp.paid?.[uid]);
                if (showOnlyOwed && !hasUnpaid) return null;
  
                return (
                    <tr key={exp.id}>
                    {editingId === exp.id ? (
                      <>
                        <td>
                          <input
                            name="title"
                            value={editForm.title}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <input
                            name="dueDate"
                            type="date"
                            value={editForm.dueDate}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>{groupData.members.find((m) => m.uid === exp.paidBy)?.name || exp.paidBy}</td>
                        <td>
                          {exp.splitWith.map((uid) => {
                            const name = groupData.members.find((m) => m.uid === uid)?.name || uid;
                            const isPaid = !!exp.paid?.[uid];
                            return (
                              <div key={uid}>
                                {name}: {uid === currentUser.uid ? (
                                  <input
                                    type="checkbox"
                                    checked={isPaid}
                                    onChange={() => handleTogglePaid(exp.id, uid, !isPaid)}
                                  />
                                ) : (
                                  <span>{isPaid ? "✅" : "❌"}</span>
                                )}
                              </div>
                            );
                          })}
                        </td>
                        <td>
                          <button onClick={() => handleSaveEdit(exp.id)}>💾</button>
                          <button onClick={() => setEditingId(null)}>x</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{exp.title}</td>
                        <td>${exp.amount.toFixed(2)}</td>
                        <td>{exp.dueDate}</td>
                        <td>{groupData.members.find((m) => m.uid === exp.paidBy)?.name || exp.paidBy}</td>
                        <td>
                          {exp.splitWith.map((uid) => {
                            const name = groupData.members.find((m) => m.uid === uid)?.name || uid;
                            const isPaid = !!exp.paid?.[uid];
                            return (
                              <div key={uid}>
                                {name}: {uid === currentUser.uid ? (
                                  <input
                                    type="checkbox"
                                    checked={isPaid}
                                    onChange={() => handleTogglePaid(exp.id, uid, !isPaid)}
                                  />
                                ) : (
                                  <span>{isPaid ? "✅" : "❌"}</span>
                                )}
                              </div>
                            );
                          })}
                        </td>
                        <td>
                          {currentUser?.uid === exp.paidBy && (
                            <>
                              <button onClick={() => startEdit(exp)}>✏️</button>
                              <button onClick={() => handleDelete(exp.id)}>🗑️</button>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>                  
                );
              })}
            </tbody>
          </table>
        </div>
  
        <div className="group-charts">
          <h4>Payment Progress</h4>
          <Pie data={pieData} />
        </div>
      </div>
    );
  }
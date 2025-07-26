import { useNavigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from "chart.js";
import "./LandingPage.css";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function LandingPage() {
  const navigate = useNavigate();

  const chartData = {
    labels: ["Paid", "Owed"],
    datasets: [
      {
        data: [450, 150,], 
        backgroundColor: ["#38bdf8", "#f87171"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="landing-wrapper">
      <div className="hero-card glass">
        <h1>GroupLiveSplit</h1>
        <p className="tagline">
          Split expenses, simplify life, and stay on the same page without the awkward Venmo texts
        </p>

        <div className="features-section">
          <h3>What GroupLiveSplit Does</h3>
          <div className="features-row">
            <div className="feature-card glass">
              <span role="img" aria-label="group">👥</span>
              <h4>Create or Join Groups</h4>
              <p>Start a group for your apartment, trip, or friend circle. Just share your group code.</p>
            </div>
            <div className="feature-card glass">
              <span role="img" aria-label="chart">📊</span>
              <h4>Track All Expenses</h4>
              <p>Every rent, Wi-Fi bill, or grocery run clearly logged and split with real-time updates.</p>
            </div>
            <div className="feature-card glass">
              <span role="img" aria-label="check">✅</span>
              <h4>Mark Paid & Stay Synced</h4>
              <p>Check off what you've paid and get gentle reminders for anything you haven't and no awkward follow-ups.</p>
            </div>
          </div>
        </div>

        <button className="cta-button" onClick={() => navigate("/signup")}>
          Get Started
        </button>

        <div className="balance-summary">
          <h3>Group Balance Overview</h3>
          <p><strong>Total:</strong> $600</p>
          <p><strong>Paid:</strong> $450</p>
          <p><strong>Owed:</strong> $150</p>

          <div className="landing-pie">
            <Pie data={chartData} />
          </div>
        </div>

      </div>

      <footer>
        <p>Made by You Petera M © 2025</p>
      </footer>
    </div>
  );
}
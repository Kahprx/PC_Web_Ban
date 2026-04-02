import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/AuthContext";
import { fetchOverviewStats } from "../../services/statsService";
import { notifyError, notifySuccess } from "../../utils/notify";
import { formatVnd } from "../../utils/currency";
import "./AdminPages.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Dashboard() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [chartRows, setChartRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const result = await fetchOverviewStats(token);
        setOverview(result?.data?.overview || null);
        setChartRows(result?.data?.chart || []);
      } catch (error) {
        notifyError(error, "Khong tai duoc thong ke");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  const chartData = useMemo(
    () => ({
      labels: chartRows.map((row) => row.month),
      datasets: [
        {
          label: "Doanh thu",
          data: chartRows.map((row) => Number(row.revenue || 0)),
          backgroundColor: "#b5542c",
          borderRadius: 8,
        },
      ],
    }),
    [chartRows]
  );

  const exportExcel = () => {
    const rows = chartRows.map((item) => ({
      month: item.month,
      total_orders: Number(item.total_orders || 0),
      revenue: Number(item.revenue || 0),
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "order_stats");
    XLSX.writeFile(workbook, "pc-store-order-statistics.xlsx");
    notifySuccess("Da export Excel");
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("PC Store - Order statistics", 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [["Month", "Total orders", "Revenue"]],
      body: chartRows.map((item) => [
        item.month,
        String(item.total_orders),
        String(item.revenue),
      ]),
    });

    doc.save("pc-store-order-statistics.pdf");
    notifySuccess("Da export PDF");
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Admin overview</p>
            <h1>Dashboard thong ke theo API that.</h1>
            <p>Co bieu do doanh thu theo thang va xuat file Excel/PDF.</p>
          </div>

          <div className="admin-hero-actions">
            <Link to="/admin/orders" className="admin-link-button">
              Mo quan ly don hang
            </Link>
            <button type="button" className="admin-link-button-outline" onClick={exportExcel}>
              Export Excel
            </button>
            <button type="button" className="admin-link-button-outline" onClick={exportPdf}>
              Export PDF
            </button>
          </div>
        </div>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-overview-card">
          <p>Tong don</p>
          <strong>{overview?.total_orders ?? 0}</strong>
          <span>So don hang toan he thong.</span>
        </article>
        <article className="admin-overview-card">
          <p>Doanh thu</p>
          <strong>{formatVnd(overview?.total_revenue ?? 0)}</strong>
          <span>Tong doanh thu tu bang orders.</span>
        </article>
        <article className="admin-overview-card">
          <p>Pending</p>
          <strong>{overview?.pending_orders ?? 0}</strong>
          <span>Don can xu ly.</span>
        </article>
        <article className="admin-overview-card">
          <p>Completed</p>
          <strong>{overview?.completed_orders ?? 0}</strong>
          <span>Don da hoan tat.</span>
        </article>
      </section>

      <section className="admin-surface">
        <div className="admin-surface-head">
          <div>
            <p className="admin-kicker">Revenue chart</p>
            <h2>Doanh thu theo thang</h2>
          </div>
        </div>

        {loading ? <p>Dang tai thong ke...</p> : null}
        {!loading && chartRows.length === 0 ? <p>Chua co du lieu thong ke.</p> : null}

        {!loading && chartRows.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { BarChart3, LineChart, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getStudentMovements,
  type Gender,
  type MovementType,
  type StudentMovementQuery,
} from "./analytics";

type ChartMode = "bar" | "line" | "direction";
const labels: Record<MovementType, string> = {
  NEW: "Mới",
  REACTIVATED: "Quay lại",
  LEAVE: "Nghỉ",
};
const colors: Record<MovementType, string> = {
  NEW: "#16a34a",
  REACTIVATED: "#2563eb",
  LEAVE: "#dc2626",
};
function monthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function range() {
  const end = new Date();
  return {
    fromMonth: monthValue(new Date(end.getFullYear(), end.getMonth() - 11, 1)),
    toMonth: monthValue(end),
  };
}

export function ReportPage() {
  const defaults = useMemo(range, []);
  const [filters, setFilters] = useState<StudentMovementQuery>(defaults);
  const [mode, setMode] = useState<ChartMode>("bar");
  const query = useQuery({
    queryKey: ["student-movements", filters],
    queryFn: ({ signal }) => getStudentMovements(filters, signal),
  });
  const monthly =
    query.data?.yearlyMovements.flatMap((year) =>
      year.quarterlyMovements.flatMap((quarter) => quarter.monthlyMovements),
    ) ?? [];
  const chartData = monthly.map((item) => ({
    month: item.month,
    NEW: item.counts.NEW ?? 0,
    REACTIVATED: item.counts.REACTIVATED ?? 0,
    LEAVE: item.counts.LEAVE ?? 0,
    LEAVE_DIRECTION: -(item.counts.LEAVE ?? 0),
  }));
  const setGender = (value: string) =>
    setFilters((current) => ({
      ...current,
      genders: value ? [value as Gender] : undefined,
    }));

  return (
    <>
      <header className="page-heading">
        <div>
          <p className="page-kicker">
            <BarChart3 size={16} /> Báo cáo quản trị
          </p>
          <h1>Biến động học viên</h1>
          <p>Theo dõi học viên mới, quay lại và nghỉ theo tháng, quý, năm.</p>
        </div>
        <button
          className="outline-button"
          type="button"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw size={17} /> Làm mới
        </button>
      </header>
      <section className="filter-bar" aria-label="Bộ lọc biến động học viên">
        <label>
          Từ tháng
          <input
            type="month"
            value={filters.fromMonth ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, fromMonth: e.target.value }))
            }
          />
        </label>
        <label>
          Đến tháng
          <input
            type="month"
            value={filters.toMonth ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, toMonth: e.target.value }))
            }
          />
        </label>
        <label>
          Tuổi từ
          <input
            type="number"
            min="0"
            value={filters.minAge ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                minAge: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </label>
        <label>
          Tuổi đến
          <input
            type="number"
            min="0"
            value={filters.maxAge ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                maxAge: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </label>
        <label>
          Giới tính
          <select
            value={filters.genders?.[0] ?? ""}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </label>
      </section>
      <section className="metric-grid">
        <Metric
          label="Đang hoạt động"
          value={query.data?.currentActiveStudents}
        />
        <Metric label="Tổng học viên" value={query.data?.totalStudents} />
        <Metric label="Số tháng" value={monthly.length} />
      </section>
      <section className="dashboard-grid">
        <div className="chart-card">
          <div className="chart-card-heading">
            <h2>Diễn biến theo tháng</h2>
            <div className="chart-switcher">
              <button
                className={mode === "bar" ? "active" : ""}
                onClick={() => setMode("bar")}
              >
                <BarChart3 size={16} /> Cột
              </button>
              <button
                className={mode === "line" ? "active" : ""}
                onClick={() => setMode("line")}
              >
                <LineChart size={16} /> Đường
              </button>
              <button
                className={mode === "direction" ? "active" : ""}
                onClick={() => setMode("direction")}
              >
                Tăng / giảm
              </button>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                {mode === "direction" ? (
                  <>
                    <Bar dataKey="NEW" name="Mới / tăng" fill={colors.NEW} />
                    <Bar
                      dataKey="REACTIVATED"
                      name="Quay lại / tăng"
                      fill={colors.REACTIVATED}
                    />
                    <Bar
                      dataKey="LEAVE_DIRECTION"
                      name="Nghỉ / giảm"
                      fill={colors.LEAVE}
                    />
                  </>
                ) : (
                  (["NEW", "REACTIVATED", "LEAVE"] as MovementType[]).map(
                    (type) =>
                      mode === "bar" ? (
                        <Bar
                          key={type}
                          dataKey={type}
                          name={labels[type]}
                          fill={colors[type]}
                        />
                      ) : (
                        <Line
                          key={type}
                          dataKey={type}
                          name={labels[type]}
                          stroke={colors[type]}
                          strokeWidth={2}
                        />
                      ),
                  )
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </article>
  );
}

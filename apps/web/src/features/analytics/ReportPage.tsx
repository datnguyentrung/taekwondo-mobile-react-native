import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, ChevronRight, CircleAlert, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getDrilldown, getReport, type AnalyticsQuery, type AnalyticsRow, type AnalyticsValue, type ReportDefinition } from './analytics'
import { asRecord, asRows, formatValue, isMoney, isRate, label } from './format'

type Props = { definition: ReportDefinition }
type FilterState = { from: string; to: string; asOf: string; minAge: string; maxAge: string; gender: string }

const defaults = (): FilterState => {
  const to = new Date()
  const from = new Date(to.getFullYear(), to.getMonth() - 11, 1)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), asOf: to.toISOString().slice(0, 10), minAge: '', maxAge: '', gender: '' }
}

function initialFilters(searchParams: URLSearchParams): FilterState {
  const base = defaults()
  return (Object.keys(base) as Array<keyof FilterState>).reduce((result, key) => ({ ...result, [key]: searchParams.get(key) ?? base[key] }), base)
}

function toRequestParams(filters: FilterState): AnalyticsQuery {
  return {
    from: filters.from, to: filters.to, asOf: filters.asOf,
    minAge: filters.minAge ? Number(filters.minAge) : undefined,
    maxAge: filters.maxAge ? Number(filters.maxAge) : undefined,
    genders: filters.gender ? [filters.gender] : undefined,
  }
}

export function ReportPage({ definition }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => initialFilters(searchParams))
  const [drilldown, setDrilldown] = useState(false)
  const [drilldownId, setDrilldownId] = useState<string | undefined>()
  const [drilldownParams, setDrilldownParams] = useState<AnalyticsQuery>({})
  const requestParams = toRequestParams(filters)
  const query = useQuery({ queryKey: ['analytics', definition.key, requestParams], queryFn: ({ signal }) => getReport(definition.key, requestParams, signal) })
  useEffect(() => { setSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), { replace: true }) }, [filters, setSearchParams])
  const data = query.data ?? {}
  const summary = asRecord(data[definition.summaryKey])
  const trend = asRows(definition.trendKey ? data[definition.trendKey] : [])
  const table = asRows(definition.tableKey ? data[definition.tableKey] : [])
  const metricEntries = Object.entries(summary).filter(([, value]) => typeof value === 'number').slice(0, 8)
  const openDrilldown = (params: AnalyticsQuery = {}, id?: string) => {
    if (!definition.drilldown) return
    setDrilldownParams(params)
    setDrilldownId(id)
    setDrilldown(true)
  }

  return <>
    <header className="page-heading"><div><p className="page-kicker"><BarChart3 size={16} aria-hidden="true" /> Báo cáo quản trị</p><h1>{definition.title}</h1><p>{definition.description}</p></div><button className="outline-button" type="button" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw size={17} aria-hidden="true" /> Làm mới</button></header>
    <section className="filter-bar" aria-label="Bộ lọc báo cáo">
      <label>Từ ngày<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
      <label>Đến ngày<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
      <label>Chốt số liệu<input type="date" value={filters.asOf} onChange={(event) => setFilters((current) => ({ ...current, asOf: event.target.value }))} /></label>
      <label>Tuổi từ<input type="number" min="0" max="100" placeholder="Tất cả" value={filters.minAge} onChange={(event) => setFilters((current) => ({ ...current, minAge: event.target.value }))} /></label>
      <label>Đến tuổi<input type="number" min="0" max="100" placeholder="Tất cả" value={filters.maxAge} onChange={(event) => setFilters((current) => ({ ...current, maxAge: event.target.value }))} /></label>
      <label>Giới tính<select value={filters.gender} onChange={(event) => setFilters((current) => ({ ...current, gender: event.target.value }))}><option value="">Tất cả</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label>
      <button className="text-button reset-filters" type="button" onClick={() => setFilters(defaults())}>Xóa bộ lọc</button>
    </section>
    {definition.dataNote && <aside className="data-note"><CircleAlert size={18} aria-hidden="true" /><span>{definition.dataNote}</span></aside>}
    {query.isLoading ? <DashboardSkeleton /> : query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : <>
      <section className="metric-grid" aria-label="Chỉ số chính">{metricEntries.map(([key, value]) => <Metric key={key} name={label(key)} value={value as AnalyticsValue} sourceKey={key} onOpen={() => openDrilldown(paramsForMetric(definition.key, key))} />)}</section>
      {definition.key === 'movement' && <MovementMatrix rows={asRows(data.byMonthAndAge)} onInspect={openDrilldown} />}
      <section className="dashboard-grid"><ChartPanel title={definition.trendKey ? 'Diễn biến trong kỳ' : 'Tóm tắt'} rows={trend} onInspect={(row) => openDrilldown(paramsForRow(definition.key, row))} /><DataQuality data={asRecord(data.quality ?? data.dataQuality ?? data.dataAvailability)} /></section>
      <TablePanel title={definition.key === 'classHealth' ? 'Lớp cần theo dõi' : 'Phân tích chi tiết'} rows={table} onInspect={definition.drilldown ? (row) => openDrilldown(paramsForRow(definition.key, row), idFor(definition.key, row)) : undefined} />
    </>}
    {drilldown && definition.drilldown && <Drilldown definition={definition} filters={requestParams} extraParams={drilldownParams} id={drilldownId} onClose={() => setDrilldown(false)} />}
  </>
}

function Metric({ name, value, sourceKey, onOpen }: { name: string; value: AnalyticsValue; sourceKey: string; onOpen: () => void }) {
  return <button type="button" className="metric-card" onClick={onOpen} aria-label={`Xem danh sách ${name}`}><span>{name}</span><strong>{formatValue(value, sourceKey)}</strong><small>Xem chi tiết</small></button>
}

function ChartPanel({ title, rows, onInspect }: { title: string; rows: AnalyticsRow[]; onInspect: (row: AnalyticsRow) => void }) {
  const numericKeys = rows.length ? Object.keys(rows[0]).filter((key) => typeof rows[0][key] === 'number' && !isRate(key) && !isMoney(key)).slice(0, 3) : []
  const nameKey = rows.length ? Object.keys(rows[0]).find((key) => /month|week|date|name/i.test(key)) ?? Object.keys(rows[0])[0] : ''
  return <article className="panel chart-panel"><div className="panel-heading"><h2>{title}</h2><span>{rows.length ? `${rows.length} mốc dữ liệu` : 'Chưa có dữ liệu'}</span></div>{rows.length && numericKeys.length ? <TrendBars rows={rows} nameKey={nameKey} numericKeys={numericKeys} onInspect={onInspect} /> : <EmptyChart />}</article>
}

function TrendBars({ rows, nameKey, numericKeys, onInspect }: { rows: AnalyticsRow[]; nameKey: string; numericKeys: string[]; onInspect: (row: AnalyticsRow) => void }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const key = numericKeys[0]
  const values = rows.map((row) => Number(row[key] ?? 0))
  const max = Math.max(...values, 1)
  const displayRows = rows.slice(-12)
  const focusRow = hovered === null ? undefined : displayRows[hovered]
  return <div className="trend-bars" aria-label={`${label(key)} theo thời gian`}><div className="trend-legend"><span><i />{label(key)}</span>{numericKeys.slice(1).map((item) => <span key={item}>{label(item)}</span>)}</div><div className="bars">{displayRows.map((row, index) => <button type="button" className="bar-item" key={`${String(row[nameKey])}-${index}`} onClick={() => onInspect(row)} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} aria-label={`Xem chi tiết ${String(row[nameKey])}`}><span className="bar-value">{formatValue(row[key] as AnalyticsValue, key)}</span><span className="bar-track"><i style={{ height: `${Math.max((Number(row[key] ?? 0) / max) * 100, 2)}%` }} /></span><small>{String(row[nameKey]).replace('-01', '')}</small></button>)}</div>{focusRow && <div className="chart-tooltip" role="status"><strong>{formatValue(focusRow[nameKey] as AnalyticsValue, nameKey)}</strong>{numericKeys.map((metric) => <span key={metric}>{label(metric)}: {formatValue(focusRow[metric] as AnalyticsValue, metric)}</span>)}</div>}</div>
}

function MovementMatrix({ rows, onInspect }: { rows: AnalyticsRow[]; onInspect: (params: AnalyticsQuery) => void }) {
  const months = [...new Set(rows.map((row) => String(row.month)))].sort()
  const ages = [...new Set(rows.map((row) => Number(row.age)))].filter(Number.isFinite).sort((a, b) => a - b)
  const valueAt = (month: string, age: number, key: 'newStudents' | 'inferredLeavers') => Number(rows.find((row) => String(row.month) === month && Number(row.age) === age)?.[key] ?? 0)
  if (!months.length || !ages.length) return null
  return <article className="panel matrix-panel"><div className="panel-heading"><div><h2>Tăng – giảm theo tháng và độ tuổi</h2><span>Nhấn vào số để xem danh sách học viên tương ứng.</span></div></div><div className="table-scroll"><table><thead><tr><th rowSpan={2}>Tuổi</th>{months.map((month) => <th colSpan={2} key={month}>{month}</th>)}</tr><tr>{months.flatMap((month) => [<th key={`${month}-new`}>Mới</th>, <th key={`${month}-left`}>Nghỉ</th>])}</tr></thead><tbody>{ages.map((age) => <tr key={age}><th>{age}</th>{months.flatMap((month) => [<td key={`${month}-${age}-new`}><button type="button" className="matrix-value added" onClick={() => onInspect({ event: 'NEW', month, age })}>{valueAt(month, age, 'newStudents')}</button></td>, <td key={`${month}-${age}-left`}><button type="button" className="matrix-value left" onClick={() => onInspect({ event: 'INFERRED_LEFT', month, age })}>{valueAt(month, age, 'inferredLeavers')}</button></td>])}</tr>)}</tbody></table></div></article>
}

function DataQuality({ data }: { data: AnalyticsRow }) { const entries = Object.entries(data); return <article className="panel quality-panel"><div className="panel-heading"><h2>Kiểm tra dữ liệu</h2><span>Đọc trước khi kết luận</span></div>{entries.length ? <dl>{entries.map(([key, value]) => <div key={key}><dt>{label(key)}</dt><dd>{formatValue(value as AnalyticsValue, key)}</dd></div>)}</dl> : <p className="muted">Không có chỉ báo chất lượng bổ sung cho báo cáo này.</p>}</article> }
function TablePanel({ title, rows, onInspect }: { title: string; rows: AnalyticsRow[]; onInspect?: (row: AnalyticsRow) => void }) { const columns = useMemo(() => rows.length ? Object.keys(rows[0]).slice(0, 8) : [], [rows]); return <article className="panel table-panel"><div className="panel-heading"><h2>{title}</h2><span>{rows.length ? `${rows.length} dòng` : ''}</span></div>{rows.length ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{label(column)}</th>)}{onInspect && <th aria-label="Xem chi tiết" />}</tr></thead><tbody>{rows.slice(0, 8).map((row, index) => <tr key={String(row.courseScheduleId ?? row.branchId ?? row.coachPersonId ?? row.trainingPlanId ?? index)}>{columns.map((column) => <td key={column}>{formatValue(row[column] as AnalyticsValue, column)}</td>)}{onInspect && <td><button type="button" className="text-button" onClick={() => onInspect(row)}>Xem <ChevronRight size={16} aria-hidden="true" /></button></td>}</tr>)}</tbody></table></div> : <p className="empty-copy">Không có dữ liệu phù hợp với kỳ và bộ lọc hiện tại.</p>}</article> }
function Drilldown({ definition, filters, extraParams, id, onClose }: { definition: ReportDefinition; filters: AnalyticsQuery; extraParams: AnalyticsQuery; id?: string; onClose: () => void }) { const params = { ...filters, ...extraParams, page: 0, size: 20 }; const query = useQuery({ queryKey: ['analytics-drilldown', definition.key, params, id], queryFn: ({ signal }) => getDrilldown(definition.drilldown!, params, id, signal) }); const rows = query.data?.content ?? []; return <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}><aside className="drawer" role="dialog" aria-modal="true" aria-label={`Chi tiết ${definition.title}`} onMouseDown={(event) => event.stopPropagation()}><div className="drawer-heading"><div><p>Chi tiết</p><h2>{definition.title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Đóng chi tiết">×</button></div>{query.isLoading ? <DashboardSkeleton /> : <TablePanel title="Danh sách chi tiết" rows={rows} />}</aside></div> }
function EmptyChart() { return <div className="chart-empty"><BarChart3 size={28} aria-hidden="true" /><span>Chưa có dữ liệu dạng chuỗi thời gian để vẽ biểu đồ.</span></div> }
function DashboardSkeleton() { return <div className="skeleton-stack" aria-label="Đang tải dữ liệu"><div /><div /><div /></div> }
function ErrorState({ onRetry }: { onRetry: () => void }) { return <section className="error-state"><h2>Không tải được báo cáo</h2><p>Kiểm tra kết nối máy chủ hoặc thử lại sau.</p><button className="primary-button" type="button" onClick={onRetry}>Thử lại</button></section> }
function idFor(key: ReportDefinition['key'], row: AnalyticsRow) { const idKey = ({ classHealth: 'courseScheduleId', plans: 'trainingPlanId', branches: 'branchId', coaches: 'coachPersonId' } as Partial<Record<ReportDefinition['key'], string>>)[key]; return idKey && row[idKey] !== undefined && row[idKey] !== null ? String(row[idKey]) : undefined }
function paramsForMetric(key: ReportDefinition['key'], metric: string): AnalyticsQuery { const event = ({ newStudents: 'NEW', reactivatedStudents: 'REACTIVATED', inferredLeavers: 'INFERRED_LEFT', transferIn: 'TRANSFER_IN', transferOut: 'TRANSFER_OUT' } as Record<string, string>)[metric]; return key === 'movement' ? { event } : key === 'overview' ? { metric: event ?? 'NEW' } : {} }
function paramsForRow(key: ReportDefinition['key'], row: AnalyticsRow): AnalyticsQuery { return key === 'movement' ? { month: typeof row.month === 'string' ? row.month : undefined } : {} }

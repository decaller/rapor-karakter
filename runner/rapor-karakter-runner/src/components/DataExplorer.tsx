import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Loader2, FileJson, CheckSquare, Square, ExternalLink } from 'lucide-react'
import { usePanelRef } from 'react-resizable-panels'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'
import { getDataRecords } from '../server/data'
import { getAllReports } from '../server/flow'
import { Render } from '@puckeditor/core'
import { reportConfig } from '#/components/puck.config'
import { ReportContext } from '#/components/ReportContext'

// 1. Schema Analyzer Panel Component
function SchemaAnalyzer({ schemaProfile, hiddenColumns, toggleColumn }: any) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <FileJson className="w-4 h-4" /> Schema Profiler
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Discovered fields across dataset</p>
      </div>
      <div className="p-2">
        {schemaProfile.map((field: any) => {
          const isHidden = hiddenColumns[field.field]
          return (
            <div
              key={field.field}
              onClick={() => toggleColumn(field.field)}
              className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <button className="text-muted-foreground group-hover:text-foreground">
                  {isHidden ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                </button>
                <span className={`text-sm truncate ${isHidden ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {field.field}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-border text-muted-foreground">
                  {Object.keys(field.typeDistribution)[0]}
                </span>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {field.presencePercentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 2. Data Grid Panel Component
function JsonbTable({ data, schemaProfile, hiddenColumns, onRowClick, selectedRowId }: any) {
  const columnHelper = createColumnHelper<any>()

  const columns = useMemo(() => {
    const baseCols = [
      columnHelper.accessor('sessionId', { header: 'Session ID', size: 120 }),
      columnHelper.accessor('createdAt', { 
        header: 'Created At',
        cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleString() : '-',
      }),
      columnHelper.accessor('formCount', { header: 'Forms' }),
    ]

    const dynamicCols = schemaProfile
      .filter((field: any) => !hiddenColumns[field.field])
      .map((field: any) =>
        columnHelper.accessor((row) => row.data?.[field.field] ?? '-', {
          id: `data_${field.field}`,
          header: field.field,
          cell: (info) => {
            const val = info.getValue()
            if (typeof val === 'object' && val !== null) {
              return <span className="text-xs text-muted-foreground">{'{...}'}</span>
            }
            return <span className="truncate block max-w-[200px]" title={String(val)}>{String(val)}</span>
          }
        })
      )

    return [...baseCols, ...dynamicCols]
  }, [schemaProfile, hiddenColumns])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full h-full overflow-auto bg-background">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-background sticky top-0 z-10 border-b border-border">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-3 font-medium whitespace-nowrap border-r border-border last:border-r-0">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className={`hover:bg-muted cursor-pointer transition-colors ${selectedRowId === (row.original as any).id ? 'bg-muted' : ''}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 border-r border-border last:border-r-0 max-w-[200px]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// 3. Report Preview Panel Component
function ReportPreview({ selectedRecord }: any) {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => getAllReports(),
  })
  const [selectedReportId, setSelectedReportId] = useState<string>('')

  useMemo(() => {
    if (reports && reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id)
    }
  }, [reports, selectedReportId])

  if (!selectedRecord) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
        <p>Select a session to preview the generated report.</p>
      </div>
    )
  }

  const selectedReport = reports?.find(r => r.id === selectedReportId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border bg-background sticky top-0 z-10 flex flex-col gap-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-foreground">
            Report Preview
          </h3>
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]" title={selectedRecord.sessionId}>
            {selectedRecord.sessionId}
          </span>
        </div>
        
        {isLoading ? (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading reports...
          </div>
        ) : reports && reports.length > 0 ? (
          <select 
            value={selectedReportId} 
            onChange={e => setSelectedReportId(e.target.value)}
            className="w-full border border-border rounded p-1.5 text-xs bg-muted text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            {reports.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        ) : (
          <div className="text-xs text-muted-foreground">No reports available</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
        {selectedReport ? (
          <div className="bg-background shadow-sm border border-border rounded-lg p-6 min-h-[500px] overflow-hidden">
            <ReportContext.Provider value={selectedRecord.data || {}}>
                <Render config={reportConfig} data={selectedReport.config} />
            </ReportContext.Provider>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
            <p>Select a report to preview.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Component Assembly
export function DataExplorer() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jsonb-records'],
    queryFn: () => getDataRecords(),
  })

  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const rightPanelRef = usePanelRef()
  const leftPanelRef = usePanelRef()
  const [isRightCollapsed, setIsRightCollapsed] = useState(true)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({})

  const toggleColumn = (field: string) => {
    setHiddenColumns(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleRowClick = (record: any) => {
    setSelectedRecord(record)
    const rightPanel = rightPanelRef.current
    if (rightPanel && rightPanel.isCollapsed()) {
      rightPanel.expand()
    }
  }

  const toggleRightPanel = () => {
    const panel = rightPanelRef.current
    if (panel) {
      if (panel.isCollapsed()) panel.expand()
      else panel.collapse()
    }
  }

  const toggleLeftPanel = () => {
    const panel = leftPanelRef.current
    if (panel) {
      if (panel.isCollapsed()) panel.expand()
      else panel.collapse()
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500 p-4 text-center">
        Error loading data: {error.message}
      </div>
    )
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full w-full rounded-none border-t border-border"
    >
      {/* Left Panel: Schema Analyzer */}
      <ResizablePanel
        panelRef={leftPanelRef}
        defaultSize={20}
        minSize={15}
        collapsible
        onResize={(size) => setIsLeftCollapsed(size.asPercentage === 0)}
        className="bg-background relative border-r border-border"
      >
        <SchemaAnalyzer
          schemaProfile={data?.schemaProfile || []}
          hiddenColumns={hiddenColumns}
          toggleColumn={toggleColumn}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Center Panel: Data Grid */}
      <ResizablePanel defaultSize={selectedRecord ? 50 : 80} minSize={30} className="relative bg-background flex flex-col">
        {/* Center Top Toolbar */}
        <div className="flex justify-between items-center p-2 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLeftPanel}
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-background shadow-sm hover:bg-background text-muted-foreground transition-colors"
              title="Toggle Schema Analyzer"
            >
              {isLeftCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <span className="text-sm font-semibold text-foreground ml-2">Data Records</span>
            <span className="text-xs bg-background border border-border px-2 py-0.5 rounded-full text-muted-foreground">
              {data?.records?.length || 0} rows
            </span>
          </div>

          <button
            onClick={toggleRightPanel}
            className="flex h-7 w-7 items-center justify-center rounded border border-border bg-background shadow-sm hover:bg-background text-muted-foreground transition-colors"
            title="Toggle Report Preview"
          >
            {isRightCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* The Grid itself */}
        <div className="flex-1 overflow-hidden">
          <JsonbTable
            data={data?.records || []}
            schemaProfile={data?.schemaProfile || []}
            hiddenColumns={hiddenColumns}
            onRowClick={handleRowClick}
            selectedRowId={selectedRecord?.id}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel: Report Preview */}
      <ResizablePanel
        panelRef={rightPanelRef}
        collapsible
        onResize={(size) => setIsRightCollapsed(size.asPercentage === 0)}
        defaultSize={50}
        minSize={20}
        className="bg-background"
      >
        <ReportPreview selectedRecord={selectedRecord} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

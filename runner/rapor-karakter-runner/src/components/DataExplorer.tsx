import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Loader2, FileJson, CheckSquare, Square } from 'lucide-react'
import { usePanelRef } from 'react-resizable-panels'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'
import { getDataRecords } from '../server/data'

// 1. Schema Analyzer Panel Component
function SchemaAnalyzer({ schemaProfile, hiddenColumns, toggleColumn }: any) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[var(--line)] bg-[var(--chip-bg)] sticky top-0 z-10">
        <h3 className="font-semibold text-sm text-[var(--sea-ink)] flex items-center gap-2">
          <FileJson className="w-4 h-4" /> Schema Profiler
        </h3>
        <p className="text-xs text-[var(--sea-ink-soft)] mt-1">Discovered fields across dataset</p>
      </div>
      <div className="p-2">
        {schemaProfile.map((field: any) => {
          const isHidden = hiddenColumns[field.field]
          return (
            <div 
              key={field.field}
              onClick={() => toggleColumn(field.field)}
              className="flex items-center justify-between p-2 hover:bg-[var(--chip-bg)] rounded cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <button className="text-[var(--sea-ink-soft)] group-hover:text-[var(--sea-ink)]">
                  {isHidden ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                </button>
                <span className={`text-sm truncate ${isHidden ? 'text-[var(--sea-ink-soft)] line-through' : 'text-[var(--sea-ink)]'}`}>
                  {field.field}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-[var(--line)] text-[var(--sea-ink-soft)]">
                  {Object.keys(field.typeDistribution)[0]}
                </span>
                <span className="text-xs text-[var(--sea-ink-soft)] w-10 text-right">
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
      columnHelper.accessor('id', { header: 'ID', size: 60 }),
      columnHelper.accessor('formId', { header: 'Form ID' }),
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
              return <span className="text-xs text-[var(--sea-ink-soft)]">{'{...}'}</span>
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
    <div className="w-full h-full overflow-auto bg-white">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-[var(--sea-ink-soft)] uppercase bg-[var(--page-bg)] sticky top-0 z-10 border-b border-[var(--line)]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-4 py-3 font-medium whitespace-nowrap border-r border-[var(--line)] last:border-r-0">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {table.getRowModel().rows.map((row) => (
            <tr 
              key={row.id} 
              onClick={() => onRowClick(row.original)}
              className={`hover:bg-[var(--chip-bg)] cursor-pointer transition-colors ${selectedRowId === row.original.id ? 'bg-[var(--chip-bg)]' : ''}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 border-r border-[var(--line)] last:border-r-0 max-w-[200px]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
             <tr>
               <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">
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
  if (!selectedRecord) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[var(--sea-ink-soft)]">
        <p>Select a row to preview the full report data.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[var(--line)] bg-[var(--chip-bg)] sticky top-0 z-10 flex justify-between items-center">
        <h3 className="font-semibold text-sm text-[var(--sea-ink)]">
          Report Preview
        </h3>
        <span className="text-xs text-[var(--sea-ink-soft)] font-mono">ID: {selectedRecord.id}</span>
      </div>
      <div className="p-4">
        <div className="bg-[var(--page-bg)] p-4 rounded-lg border border-[var(--line)] font-mono text-xs overflow-x-auto text-[var(--sea-ink)]">
          <pre>{JSON.stringify(selectedRecord.data, null, 2)}</pre>
        </div>
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
        <Loader2 className="w-8 h-8 animate-spin text-[var(--sea-ink-soft)]" />
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
      className="h-full w-full rounded-none border-t border-[var(--line)]"
    >
      {/* Left Panel: Schema Analyzer */}
      <ResizablePanel 
        panelRef={leftPanelRef}
        defaultSize={20} 
        minSize={15} 
        collapsible
        onCollapse={() => setIsLeftCollapsed(true)}
        onExpand={() => setIsLeftCollapsed(false)}
        className="bg-white relative border-r border-[var(--line)]"
      >
        <SchemaAnalyzer 
          schemaProfile={data?.schemaProfile || []} 
          hiddenColumns={hiddenColumns}
          toggleColumn={toggleColumn}
        />
      </ResizablePanel>

      <ResizableHandle className="w-1 bg-[var(--line)] hover:bg-[var(--sea-ink-soft)] transition-colors" />

      {/* Center Panel: Data Grid */}
      <ResizablePanel defaultSize={selectedRecord ? 50 : 80} minSize={30} className="relative bg-white flex flex-col">
         {/* Center Top Toolbar */}
         <div className="flex justify-between items-center p-2 border-b border-[var(--line)] bg-[var(--chip-bg)]">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLeftPanel}
              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--line)] bg-white shadow-sm hover:bg-[var(--page-bg)] text-[var(--sea-ink-soft)] transition-colors"
              title="Toggle Schema Analyzer"
            >
              {isLeftCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <span className="text-sm font-semibold text-[var(--sea-ink)] ml-2">Data Records</span>
            <span className="text-xs bg-white border border-[var(--line)] px-2 py-0.5 rounded-full text-[var(--sea-ink-soft)]">
              {data?.records?.length || 0} rows
            </span>
          </div>

          <button
            onClick={toggleRightPanel}
            className="flex h-7 w-7 items-center justify-center rounded border border-[var(--line)] bg-white shadow-sm hover:bg-[var(--page-bg)] text-[var(--sea-ink-soft)] transition-colors"
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

      <ResizableHandle className="w-1 bg-[var(--line)] hover:bg-[var(--sea-ink-soft)] transition-colors" />

      {/* Right Panel: Report Preview */}
      <ResizablePanel
        panelRef={rightPanelRef}
        collapsible
        defaultSize={0} // Start collapsed or 30% if we wanted open by default. Use 30 but state is collapsed? react-resizable-panels starts collapsed if defaultSize is 0, but here let's set it to 30 and manage via ref.
        // Actually, to make it start collapsed, we just don't pass defaultSize=0, we let it be defaultSize={30} but we need a way to collapse on mount.
        // Or if we want it collapsed initially, we can't easily do it via props without causing jitter, but we can do it via `defaultSize={0}` and then `expand()` sets it to `minSize` or similar. Let's use defaultSize={30} but use `useLayoutEffect` or we just let it be open if defaultSize=30.
        // For simplicity, let's make it 30 by default but if `!selectedRecord`, it shows the placeholder.
        // The user said "lets try the 3 panel first" and they wanted to "see the report on the right side". Let's give it defaultSize={30} and let it stay open to act as a preview pane!
        onCollapse={() => setIsRightCollapsed(true)}
        onExpand={() => setIsRightCollapsed(false)}
        defaultSize={30}
        minSize={20}
        className="bg-white"
      >
        <ReportPreview selectedRecord={selectedRecord} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

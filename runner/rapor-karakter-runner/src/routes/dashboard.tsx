import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePanelRef } from 'react-resizable-panels'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'

const checkAuth = createServerFn({ method: 'GET' })
  .handler(async () => {
    const auth = getCookie('auth')
    return { isAuthenticated: auth === 'true' }
  })

type DashboardSearch = {
  tab?: 'home' | 'data' | 'monitoring'
}

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    return {
      tab: search.tab as DashboardSearch['tab'] || 'home',
    }
  },
  beforeLoad: async () => {
    const { isAuthenticated } = await checkAuth()
    if (!isAuthenticated) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: DashboardComponent,
})

function DashboardComponent() {
  const { tab } = Route.useSearch()

  const rightPanelRef = usePanelRef()
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)

  const toggleRightPanel = () => {
    const panel = rightPanelRef.current
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand()
      } else {
        panel.collapse()
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <main className="flex-1 overflow-hidden bg-[var(--page-bg)]">
        {tab === 'home' && (
          <div className="h-full p-4 sm:p-6">
            <div className="border-2 border-dashed border-[var(--line)] rounded-xl h-full flex flex-col items-center justify-center bg-white/50">
              <h2 className="text-xl font-bold text-[var(--sea-ink)] mb-2">Grid Dashboard</h2>
              <p className="text-[var(--sea-ink-soft)]">Blank container for now</p>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full w-full rounded-none border-t border-[var(--line)]"
          >
            <ResizablePanel defaultSize={25} minSize={15} className="bg-[var(--chip-bg)] relative">
              <div className="flex h-full flex-col p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-[var(--sea-ink)]">Sidebar</span>
                  <button
                    onClick={toggleRightPanel}
                    className="flex h-6 w-6 items-center justify-center rounded-sm border border-[var(--line)] bg-[var(--page-bg)] shadow-sm hover:bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] transition-colors"
                    title={isRightCollapsed ? "Expand content panel" : "Collapse content panel"}
                  >
                    {isRightCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-[var(--sea-ink-soft)]">Data Explorer</p>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel
              panelRef={rightPanelRef}
              collapsible
              onCollapse={() => setIsRightCollapsed(true)}
              onExpand={() => setIsRightCollapsed(false)}
              defaultSize={75}
              minSize={30}
            >
              <div className="flex h-full flex-col p-6">
                <span className="font-semibold text-[var(--sea-ink)] mb-4">Content</span>
                <p className="text-sm text-[var(--sea-ink-soft)]">Main Data View</p>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}

        {tab === 'monitoring' && (
          <div className="h-full p-4 flex flex-col items-center justify-center">
            <p className="text-lg text-[var(--sea-ink-soft)] font-medium">Monitoring reserved for later</p>
          </div>
        )}
      </main>
    </div>
  )
}

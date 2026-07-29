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
import { DataExplorer } from '../components/DataExplorer'


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

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground">
      <main className="flex-1 overflow-hidden bg-background">
        {tab === 'home' && (
          <div className="h-full p-4 sm:p-6">
            <div className="border-2 border-dashed border-border rounded-xl h-full flex flex-col items-center justify-center bg-muted/50">
              <h2 className="text-xl font-bold text-foreground mb-2">Grid Dashboard</h2>
              <p className="text-muted-foreground">Blank container for now</p>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <DataExplorer />
        )}

        {tab === 'monitoring' && (
          <div className="h-full p-4 flex flex-col items-center justify-center">
            <p className="text-lg text-muted-foreground font-medium">Monitoring reserved for later</p>
          </div>
        )}
      </main>
    </div>
  )
}

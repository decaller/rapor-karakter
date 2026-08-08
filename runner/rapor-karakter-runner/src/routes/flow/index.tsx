import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { getAllFlows } from '../../server/flow'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

export const Route = createFileRoute('/flow/')({
  component: FlowHomepage,
})

function FlowHomepage() {
  const router = useRouter()
  const search: any = Route.useSearch()
  
  const { data: flows, isLoading } = useQuery({
    queryKey: ['flows'],
    queryFn: () => getAllFlows(),
  })

  // Clear success query param if user starts a new flow or navigates away
  // But we want to show it on load.

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        
        {search?.success && (
          <div className="bg-card border border-primary/50 p-4 rounded-md shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-card-foreground">
                  Thank you! You have successfully completed the flow. Would you like to start another one?
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Available Workflows</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Please select a workflow from the list below to begin.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center mt-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {flows?.map((flow) => (
              <div key={flow.id} className="bg-card overflow-hidden shadow-sm rounded-lg border border-border transition-all hover:shadow-md hover:border-primary/50">
                <div className="px-4 py-5 sm:p-6 flex flex-col h-full">
                  <h3 className="text-lg leading-6 font-medium text-card-foreground mb-2">
                    {flow.name || flow.id}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</span>
                    <code className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                      {flow.id}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground flex-grow mb-6">
                    This workflow contains {flow.steps?.length || 0} steps.
                  </p>
                  <Link
                    to={`/flow/${flow.id}/step/0`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring w-full"
                  >
                    Start Flow
                  </Link>
                </div>
              </div>
            ))}
            
            {(!flows || flows.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed border-border">
                No flows have been created yet. Head over to the Builder to create one!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

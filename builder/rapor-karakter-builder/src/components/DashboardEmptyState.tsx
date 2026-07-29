import { FileSignature, Blocks } from 'lucide-react'

export function DashboardEmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8 text-muted-foreground h-full bg-muted/10">
            <div className="flex gap-4 mb-4 opacity-50">
                <FileSignature className="w-12 h-12" />
                <Blocks className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Welcome to Builder</h2>
            <p className="max-w-md">
                Select a form or report from the sidebar to start editing, or create a new one using the buttons below.
            </p>
        </div>
    )
}

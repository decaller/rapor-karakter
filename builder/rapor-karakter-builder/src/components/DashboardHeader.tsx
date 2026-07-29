
import { MoreVertical, Copy, Trash2, Edit2, Link, ExternalLink } from 'lucide-react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { WorkspaceItem } from '#/lib/workspace'

export function DashboardHeader({
    activeItem,
    actions,
}: {
    activeItem?: WorkspaceItem
    actions: {
        onDuplicate: (item: WorkspaceItem) => void
        onDelete: (item: WorkspaceItem) => void
        onRename: (item: WorkspaceItem) => void
        onEditSlug: (item: WorkspaceItem) => void
    }
}) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/dashboard">Workspace</BreadcrumbLink>
                        </BreadcrumbItem>
                        {activeItem && (
                            <>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        {activeItem.name}
                                        <span className="text-muted-foreground text-xs ml-1">
                                            .{activeItem.type === 'form' ? 'frm' : 'rep'}
                                        </span>
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {activeItem && (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <a 
                            href={`http://localhost:${import.meta.env.VITE_RUNNER_PORT || 3001}/${activeItem.type}/${activeItem.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Live Preview"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="sr-only">Live Preview</span>
                        </a>
                    </Button>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => actions.onRename(activeItem)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actions.onEditSlug(activeItem)}>
                            <Link className="w-4 h-4 mr-2" /> Edit Slug
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actions.onDuplicate(activeItem)}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => actions.onDelete(activeItem)}
                            className="text-destructive focus:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            )}
        </header>
    )
}

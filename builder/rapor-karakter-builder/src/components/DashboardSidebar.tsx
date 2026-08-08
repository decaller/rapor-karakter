import * as React from 'react'
import { ChevronRight, FileCode2, FileLineChart, Folder, Plus, Copy, Trash2, Edit2, FilePlus, FolderPlus, Link, Workflow } from 'lucide-react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarRail,
} from '@/components/ui/sidebar'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from '@/components/ui/context-menu'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Braces } from 'lucide-react'
import type { WorkspaceItem } from '#/lib/workspace'
import { Button } from '@/components/ui/button'

type ActionHandlers = {
    onNewFolder: (parentId?: string) => void
    onNewItem: (type: 'form' | 'report' | 'flow' | 'processor', parentId?: string) => void
    onDuplicate: (item: WorkspaceItem) => void
    onDelete: (item: WorkspaceItem) => void
    onRename: (item: WorkspaceItem) => void
    onEditSlug: (item: WorkspaceItem) => void
    onMove?: (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void
}

export function DashboardSidebar({
    tree,
    actions,
    ...props
}: React.ComponentProps<typeof Sidebar> & {
    tree: WorkspaceItem[]
    actions: ActionHandlers
}) {
    return (
        <Sidebar {...props}>
            <SidebarContent>
                <SidebarGroup
                    onDragOver={(e) => { e.preventDefault() }}
                    onDrop={(e) => {
                        e.preventDefault()
                        try {
                            const data = JSON.parse(e.dataTransfer.getData('application/json'))
                            if (data.id) actions.onMove?.(data.id, null, 'inside')
                        } catch (err) {}
                    }}
                >
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {tree.map((item) => (
                                <TreeItemNode key={item.id} item={item} actions={actions} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
            <SidebarFooter className="p-4 flex flex-col gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:text-white justify-between">
                            <span className="flex items-center"><Plus className="w-4 h-4 mr-2" /> Create New</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="center" side="top">
                        <DropdownMenuItem onClick={() => actions.onNewItem('flow')} className="cursor-pointer">
                            <Workflow className="w-4 h-4 mr-2" /> Flow
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actions.onNewItem('form')} className="cursor-pointer">
                            <FileCode2 className="w-4 h-4 mr-2" /> Form
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actions.onNewItem('report')} className="cursor-pointer">
                            <FileLineChart className="w-4 h-4 mr-2" /> Report
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actions.onNewItem('processor')} className="cursor-pointer">
                            <Braces className="w-4 h-4 mr-2" /> Processor
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

function TreeItemNode({
    item,
    actions,
}: {
    item: WorkspaceItem
    actions: ActionHandlers
}) {
    const navigate = useNavigate({ from: '/dashboard' })
    // We safely get search params. If not on /dashboard, this will be empty, but that's fine.
    const search = useSearch({ strict: false }) as { type?: string; id?: string }
    const isActive = search.id === item.id

    const [dragOverPosition, setDragOverPosition] = React.useState<'before' | 'after' | 'inside' | null>(null)

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id }))
        e.stopPropagation()
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const y = e.clientY - rect.top
        
        if (item.type === 'folder') {
            if (y < rect.height * 0.25) setDragOverPosition('before')
            else if (y > rect.height * 0.75) setDragOverPosition('after')
            else setDragOverPosition('inside')
        } else {
            if (y < rect.height * 0.5) setDragOverPosition('before')
            else setDragOverPosition('after')
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        setDragOverPosition(null)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const pos = dragOverPosition
        setDragOverPosition(null)
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'))
            if (data.id && data.id !== item.id && pos) {
                actions.onMove?.(data.id, item.id, pos)
            }
        } catch (err) {}
    }

    const dndProps = {
        draggable: true,
        onDragStart: handleDragStart,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
    }

    const dragClass = dragOverPosition === 'before' ? 'border-t-2 border-t-primary rounded-none' 
                    : dragOverPosition === 'after' ? 'border-b-2 border-b-primary rounded-none'
                    : dragOverPosition === 'inside' ? 'bg-primary/20'
                    : ''

    if (item.type !== 'folder') {
        const Icon = item.type === 'form' ? FileCode2 : item.type === 'report' ? FileLineChart : item.type === 'processor' ? Braces : Workflow

        return (
            <SidebarMenuItem {...dndProps} className={dragClass}>
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <SidebarMenuButton
                            isActive={isActive}
                            onClick={() =>
                                navigate({
                                    to: '/dashboard',
                                    search: { type: item.type as 'form' | 'report' | 'flow' | 'processor', id: item.id },
                                })
                            }
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-2 opacity-50 truncate">
                                /{item.id}
                            </span>
                        </SidebarMenuButton>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={() => actions.onRename(item)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Rename
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => actions.onEditSlug(item)}>
                            <Link className="w-4 h-4 mr-2" /> Edit Slug
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => actions.onDuplicate(item)}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            onClick={() => actions.onDelete(item)}
                            className="text-destructive focus:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            </SidebarMenuItem>
        )
    }

    return (
        <SidebarMenuItem {...dndProps} className={dragClass}>
            <Collapsible
                className="group/collapsible [&[data-state=open]>div>button>svg:first-child]:rotate-90"
                defaultOpen={true}
            >
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <div className="flex items-center">
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <ChevronRight className="transition-transform w-4 h-4" />
                                    <Folder className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={() => actions.onNewItem('form', item.id)}>
                            <FilePlus className="w-4 h-4 mr-2" /> New Form
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => actions.onNewItem('report', item.id)}>
                            <FilePlus className="w-4 h-4 mr-2" /> New Report
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => actions.onNewItem('processor', item.id)}>
                            <Braces className="w-4 h-4 mr-2" /> New Processor
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => actions.onNewItem('flow', item.id)}>
                            <Workflow className="w-4 h-4 mr-2" /> New Flow
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => actions.onNewFolder(item.id)}>
                            <FolderPlus className="w-4 h-4 mr-2" /> New Folder
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => actions.onRename(item)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Rename Folder
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => actions.onEditSlug(item)}>
                            <Link className="w-4 h-4 mr-2" /> Edit Slug
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={() => actions.onDelete(item)}
                            className="text-destructive focus:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Folder
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.children?.map((subItem) => (
                            <TreeItemNode key={subItem.id} item={subItem} actions={actions} />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    )
}

import * as React from 'react'
import { ChevronRight, FileCode2, FileLineChart, Folder, Plus, Copy, Trash2, Edit2, FilePlus, FolderPlus } from 'lucide-react'
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
import type { WorkspaceItem } from '#/lib/workspace'
import { Button } from '@/components/ui/button'

type ActionHandlers = {
    onNewFolder: (parentId?: string) => void
    onNewItem: (type: 'form' | 'report', parentId?: string) => void
    onDuplicate: (item: WorkspaceItem) => void
    onDelete: (item: WorkspaceItem) => void
    onRename: (item: WorkspaceItem) => void
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
                <SidebarGroup>
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
            <SidebarFooter className="p-4 flex flex-row gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => actions.onNewItem('form')}>
                    <Plus className="w-4 h-4 mr-1" /> Form
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => actions.onNewItem('report')}>
                    <Plus className="w-4 h-4 mr-1" /> Report
                </Button>
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

    if (item.type !== 'folder') {
        const Icon = item.type === 'form' ? FileCode2 : FileLineChart
        const ext = item.type === 'form' ? '.frm' : '.rep'

        return (
            <SidebarMenuItem>
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <SidebarMenuButton
                            isActive={isActive}
                            onClick={() =>
                                navigate({
                                    to: '/dashboard',
                                    search: { type: item.type as 'form' | 'report', id: item.id },
                                })
                            }
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                            <span className="text-xs text-muted-foreground ml-1">{ext}</span>
                        </SidebarMenuButton>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem onClick={() => actions.onRename(item)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Rename
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
        <SidebarMenuItem>
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
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => actions.onNewFolder(item.id)}>
                            <FolderPlus className="w-4 h-4 mr-2" /> New Folder
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => actions.onRename(item)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Rename Folder
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

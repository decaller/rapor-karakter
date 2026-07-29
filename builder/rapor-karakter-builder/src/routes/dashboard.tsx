import React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { DashboardSidebar } from '#/components/DashboardSidebar'
import { DashboardHeader } from '#/components/DashboardHeader'
import { DashboardEmptyState } from '#/components/DashboardEmptyState'
import { FormEditorInline } from '#/components/FormEditorInline'
import { ReportEditorInline } from '#/components/ReportEditorInline'
import { loadWorkspace, saveWorkspace, deleteWorkspaceItem, type WorkspaceItem } from '#/lib/workspace'

export const Route = createFileRoute('/dashboard')({
    validateSearch: (search: Record<string, unknown>): { type?: 'form' | 'report'; id?: string } => {
        return {
            type: search.type as 'form' | 'report' | undefined,
            id: search.id as string | undefined,
        }
    },
    loader: async () => {
        return loadWorkspace()
    },
    component: DashboardPage,
})

function DashboardPage() {
    const initialWorkspace = Route.useLoaderData()
    const { type, id } = Route.useSearch()
    const navigate = useNavigate({ from: '/dashboard' })

    // We can manage the workspace tree locally and sync it
    const [tree, setTree] = React.useState(initialWorkspace.tree)

    const findItem = (items: WorkspaceItem[], targetId: string): WorkspaceItem | undefined => {
        for (const item of items) {
            if (item.id === targetId) return item
            if (item.children) {
                const found = findItem(item.children, targetId)
                if (found) return found
            }
        }
        return undefined
    }

    const activeItem = id ? findItem(tree, id) : undefined

    const updateTree = async (newTree: WorkspaceItem[]) => {
        setTree(newTree)
        await saveWorkspace({ data: newTree })
    }

    const handleNewItem = async (itemType: 'form' | 'report', parentId?: string) => {
        const newName = prompt(`Enter new ${itemType} name:`)
        if (!newName) return
        
        const newId = `${itemType}-${Date.now()}`
        const newItem: WorkspaceItem = { id: newId, type: itemType, name: newName }
        
        const newTree = [...tree]
        if (parentId) {
            const parent = findItem(newTree, parentId)
            if (parent && parent.type === 'folder') {
                parent.children = [...(parent.children || []), newItem]
            } else {
                newTree.push(newItem)
            }
        } else {
            const folderId = itemType === 'form' ? 'forms-folder' : 'reports-folder'
            const folder = findItem(newTree, folderId)
            if (folder && folder.type === 'folder') {
                folder.children = [...(folder.children || []), newItem]
            } else {
                newTree.push(newItem)
            }
        }

        await updateTree(newTree)
        navigate({ search: { type: itemType, id: newId } })
    }

    const handleNewFolder = async (parentId?: string) => {
        const newName = prompt('Enter new folder name:')
        if (!newName) return

        const newId = `folder-${Date.now()}`
        const newFolder: WorkspaceItem = { id: newId, type: 'folder', name: newName, children: [] }

        const newTree = [...tree]
        if (parentId) {
            const parent = findItem(newTree, parentId)
            if (parent && parent.type === 'folder') {
                parent.children = [...(parent.children || []), newFolder]
            } else {
                newTree.push(newFolder)
            }
        } else {
            newTree.push(newFolder)
        }

        await updateTree(newTree)
    }

    const handleDelete = async (item: WorkspaceItem) => {
        if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return
        
        const filterTree = (items: WorkspaceItem[]): WorkspaceItem[] => {
            return items.filter(i => {
                if (i.id === item.id) return false
                if (i.children) i.children = filterTree(i.children)
                return true
            })
        }

        const newTree = filterTree([...tree])
        await updateTree(newTree)
        
        if (item.type !== 'folder') {
            await deleteWorkspaceItem({ data: { id: item.id, type: item.type } })
        }

        if (activeItem?.id === item.id) {
            navigate({ search: {} })
        }
    }

    const handleRename = async (item: WorkspaceItem) => {
        const newName = prompt('Enter new name:', item.name)
        if (!newName || newName === item.name) return

        const updateItemName = (items: WorkspaceItem[]) => {
            for (const i of items) {
                if (i.id === item.id) {
                    i.name = newName
                    return true
                }
                if (i.children && updateItemName(i.children)) return true
            }
            return false
        }

        const newTree = [...tree]
        updateItemName(newTree)
        await updateTree(newTree)
    }

    const handleDuplicate = async (item: WorkspaceItem) => {
        if (item.type === 'folder') return // Not supported yet

        const newName = `${item.name} (Copy)`
        const newId = `${item.type}-${Date.now()}`
        const newItem: WorkspaceItem = { id: newId, type: item.type, name: newName }
        
        const duplicateInTree = (items: WorkspaceItem[]): boolean => {
            const index = items.findIndex(i => i.id === item.id)
            if (index !== -1) {
                items.splice(index + 1, 0, newItem)
                return true
            }
            for (const i of items) {
                if (i.children && duplicateInTree(i.children)) return true
            }
            return false
        }

        const newTree = [...tree]
        duplicateInTree(newTree)
        await updateTree(newTree)
        // Also need to duplicate the actual config files. For now, they will just be created empty when opened.
        // Or we could duplicate the file here. 
        // Let's rely on empty for now to keep it simple, or user can implement deep copy later.

        navigate({ search: { type: item.type, id: newId } })
    }

    const handleMove = async (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
        if (draggedId === targetId) return

        const cloneTree = (items: WorkspaceItem[]): WorkspaceItem[] => {
            return items.map(item => ({
                ...item,
                children: item.children ? cloneTree(item.children) : undefined
            }))
        }
        const newTree = cloneTree(tree)

        let draggedItem: WorkspaceItem | undefined
        const findAndRemove = (items: WorkspaceItem[]): boolean => {
            const index = items.findIndex(i => i.id === draggedId)
            if (index !== -1) {
                draggedItem = items[index]
                items.splice(index, 1)
                return true
            }
            for (const item of items) {
                if (item.children && findAndRemove(item.children)) return true
            }
            return false
        }

        const isDescendant = (item: WorkspaceItem, id: string): boolean => {
            if (item.id === id) return true
            if (item.children) {
                return item.children.some(child => isDescendant(child, id))
            }
            return false
        }

        findAndRemove(newTree)
        if (!draggedItem) return

        if (targetId && isDescendant(draggedItem, targetId)) {
            return
        }

        if (targetId === null) {
            newTree.push(draggedItem)
        } else {
            const insertItem = (items: WorkspaceItem[]): boolean => {
                const index = items.findIndex(i => i.id === targetId)
                if (index !== -1) {
                    if (position === 'inside') {
                        const target = items[index]
                        if (target.type === 'folder') {
                            target.children = target.children || []
                            target.children.push(draggedItem!)
                        }
                    } else if (position === 'before') {
                        items.splice(index, 0, draggedItem!)
                    } else if (position === 'after') {
                        items.splice(index + 1, 0, draggedItem!)
                    }
                    return true
                }
                for (const item of items) {
                    if (item.children && insertItem(item.children)) return true
                }
                return false
            }
            insertItem(newTree)
        }

        await updateTree(newTree)
    }

    const actions = {
        onNewItem: handleNewItem,
        onNewFolder: handleNewFolder,
        onDelete: handleDelete,
        onRename: handleRename,
        onDuplicate: handleDuplicate,
        onMove: handleMove,
    }

    return (
        <SidebarProvider>
            <DashboardSidebar tree={tree} actions={actions} />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <DashboardHeader activeItem={activeItem} actions={actions} />
                <div className="flex-1 flex flex-col relative overflow-hidden bg-muted/10">
                    {!type || !id ? (
                        <DashboardEmptyState />
                    ) : type === 'form' ? (
                        <FormEditorInline key={id} formId={id} />
                    ) : (
                        <ReportEditorInline key={id} reportId={id} />
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

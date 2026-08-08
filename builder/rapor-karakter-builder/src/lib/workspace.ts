import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkspaceItem = {
    id: string
    type: 'form' | 'report' | 'flow' | 'folder'
    name: string
    children?: WorkspaceItem[]
}

export type WorkspaceConfig = {
    version: number
    tree: WorkspaceItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function workspacePath() {
    return path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../../..',
        'shared/workspace.json',
    )
}

function itemConfigPath(type: 'form' | 'report' | 'flow', id: string) {
    const folder = type === 'form' ? 'forms' : type === 'report' ? 'reports' : 'flows'
    return path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../../..',
        `shared/${folder}/configs/${id}.json`,
    )
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const loadWorkspace = createServerFn({ method: 'GET' })
    .handler(async () => {
        let config: WorkspaceConfig = { version: 1, tree: [] }
        try {
            const raw = await fs.readFile(workspacePath(), 'utf-8')
            config = JSON.parse(raw) as WorkspaceConfig
        } catch {
            // keep default
        }

        // Ensure directories exist and read them to sync any untracked files
        const baseDir = path.dirname(workspacePath())
        const types: ('form' | 'report' | 'flow')[] = ['form', 'report', 'flow']
        
        let modified = false
        const allIds = new Set<string>()
        
        const extractIds = (items: WorkspaceItem[]) => {
            for (const item of items) {
                if (item.type !== 'folder') allIds.add(`${item.type}:${item.id}`)
                if (item.children) extractIds(item.children)
            }
        }
        extractIds(config.tree)

        for (const type of types) {
            const folder = type === 'form' ? 'forms' : type === 'report' ? 'reports' : 'flows'
            const configsPath = path.resolve(baseDir, `${folder}/configs`)
            
            try {
                await fs.mkdir(configsPath, { recursive: true })
                const files = await fs.readdir(configsPath)
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const id = file.replace('.json', '')
                        if (!allIds.has(`${type}:${id}`)) {
                            // Find or create default folder
                            const folderId = type === 'form' ? 'forms-folder' : type === 'report' ? 'reports-folder' : 'flows-folder'
                            let targetFolder = config.tree.find(i => i.id === folderId)
                            if (!targetFolder) {
                                targetFolder = {
                                    id: folderId,
                                    type: 'folder',
                                    name: type === 'form' ? 'Forms' : type === 'report' ? 'Reports' : 'Flows',
                                    children: []
                                }
                                config.tree.push(targetFolder)
                            }
                            targetFolder.children = targetFolder.children || []
                            targetFolder.children.push({
                                id,
                                type,
                                name: id
                            })
                            allIds.add(`${type}:${id}`)
                            modified = true
                        }
                    }
                }
            } catch (err) {
                console.error(`Failed to read ${configsPath}`, err)
            }
        }
        
        if (modified) {
            await fs.writeFile(workspacePath(), JSON.stringify(config, null, 2), 'utf-8')
        }

        return config
    })

export const saveWorkspace = createServerFn({ method: 'POST' })
    .validator((tree: WorkspaceItem[]) => tree)
    .handler(async ({ data: tree }) => {
        const config: WorkspaceConfig = { version: 1, tree }
        const filePath = workspacePath()
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8')
        return config
    })

export const deleteWorkspaceItem = createServerFn({ method: 'POST' })
    .validator((input: { id: string; type: 'form' | 'report' | 'flow' }) => input)
    .handler(async ({ data: { id, type } }) => {
        const filePath = itemConfigPath(type, id)
        try {
            await fs.unlink(filePath)
        } catch (e) {
            console.error('Failed to delete config file', e)
        }
        return { ok: true }
    })

export const renameWorkspaceFile = createServerFn({ method: 'POST' })
    .validator((input: { type: 'form' | 'report' | 'flow', oldId: string, newId: string }) => input)
    .handler(async ({ data: { type, oldId, newId } }) => {
        const oldPath = itemConfigPath(type, oldId)
        const newPath = itemConfigPath(type, newId)
        try {
            await fs.rename(oldPath, newPath)
        } catch (e) {
            console.error('Failed to rename config file', e)
        }
        return { ok: true }
    })

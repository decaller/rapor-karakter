import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkspaceItem = {
    id: string
    type: 'form' | 'report' | 'folder'
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

function itemConfigPath(type: 'form' | 'report', id: string) {
    const folder = type === 'form' ? 'forms' : 'reports'
    return path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../../..',
        `shared/${folder}/configs/${id}/index.json`,
    )
}

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const loadWorkspace = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            const raw = await fs.readFile(workspacePath(), 'utf-8')
            return JSON.parse(raw) as WorkspaceConfig
        } catch {
            return { version: 1, tree: [] }
        }
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
    .validator((input: { id: string; type: 'form' | 'report' }) => input)
    .handler(async ({ data: { id, type } }) => {
        const filePath = itemConfigPath(type, id)
        const dirPath = path.dirname(filePath)
        try {
            await fs.rm(dirPath, { recursive: true, force: true })
        } catch (e) {
            console.error('Failed to delete config directory', e)
        }
        return { ok: true }
    })

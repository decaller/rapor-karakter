import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export type FlowStep = {
    type: 'form' | 'report'
    id: string
}

export type FlowConfig = {
    id: string
    name: string
    webhook?: string
    steps: FlowStep[]
    testData?: Record<string, any>
}

function flowConfigPath(id: string) {
    return path.resolve(
        process.cwd(),
        '../../shared/flows/configs',
        `${id}.json`
    )
}

function flowsDirectory() {
    return path.resolve(
        process.cwd(),
        '../../shared/flows/configs'
    )
}

export const getFlowById = createServerFn({ method: 'GET' })
    .validator((id: string) => id)
    .handler(async ({ data: id }) => {
        try {
            const raw = await fs.readFile(flowConfigPath(id), 'utf-8')
            return JSON.parse(raw) as FlowConfig
        } catch (e) {
            return null
        }
    })

export const getAllFlows = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            const dir = flowsDirectory()
            const files = await fs.readdir(dir)
            const flows: FlowConfig[] = []
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const raw = await fs.readFile(path.join(dir, file), 'utf-8')
                        flows.push(JSON.parse(raw) as FlowConfig)
                    } catch (e) {
                        // ignore invalid files
                    }
                }
            }
            return flows
        } catch (e) {
            return []
        }
    })

export const getAllReports = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            const dir = path.resolve(process.cwd(), '../../shared/reports/configs')
            const files = await fs.readdir(dir)
            const reports: any[] = []
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const raw = await fs.readFile(path.join(dir, file), 'utf-8')
                        const parsed = JSON.parse(raw)
                        reports.push({ 
                            id: parsed.id || file.replace('.json', ''), 
                            name: parsed.name || file,
                            config: parsed 
                        })
                    } catch (e) {
                        // ignore invalid files
                    }
                }
            }
            return reports
        } catch (e) {
            return []
        }
    })

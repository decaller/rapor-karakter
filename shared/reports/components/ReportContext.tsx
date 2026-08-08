import { createContext, useContext } from 'react'

export const ReportContext = createContext<Record<string, unknown>>({})

export function useReportData() {
    return useContext(ReportContext)
}

/**
 * Replaces {{key}} with the value from the data record.
 * Only replaces if the value is defined.
 */
export function resolvePlaceholders(text: string, data: Record<string, unknown>) {
    if (!text || typeof text !== 'string') return text
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const path = key.trim().split('.')
        let val: any = data
        for (const p of path) {
            if (val && typeof val === 'object' && p in val) {
                val = val[p as keyof typeof val]
            } else {
                return match // unable to resolve path completely
            }
        }
        return val !== undefined && val !== null ? String(val) : match
    })
}

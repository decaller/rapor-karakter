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
        const val = data[key.trim()]
        return val !== undefined ? String(val) : match
    })
}

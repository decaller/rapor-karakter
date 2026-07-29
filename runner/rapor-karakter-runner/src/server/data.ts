import { createServerFn } from '@tanstack/react-start'
import { db } from '../db/index'
import { formSubmissions } from '../db/schema'
import { isNotNull } from 'drizzle-orm'

function profileFields(documents: any[]) {
  const fieldStats: Record<string, { count: number; types: Record<string, number> }> = {}
  const totalDocs = documents.length

  function traverse(obj: any, prefix = '') {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key
      
      let type = typeof value
      if (value === null) type = 'null'
      else if (Array.isArray(value)) type = 'array'

      if (!fieldStats[fieldPath]) {
        fieldStats[fieldPath] = { count: 0, types: {} }
      }

      fieldStats[fieldPath].count++
      fieldStats[fieldPath].types[type] = (fieldStats[fieldPath].types[type] || 0) + 1

      if (type === 'object') {
        traverse(value, fieldPath)
      }
    }
  }

  documents.forEach(doc => traverse(doc))

  // Format statistics
  return Object.entries(fieldStats).map(([field, data]) => ({
    field,
    presencePercentage: Number(((data.count / (totalDocs || 1)) * 100).toFixed(1)),
    typeDistribution: Object.fromEntries(
      Object.entries(data.types).map(([t, count]) => [
        t,
        `${((count / data.count) * 100).toFixed(1)}%`
      ])
    )
  })).sort((a, b) => b.presencePercentage - a.presencePercentage) // Sort by presence
}

export const getDataRecords = createServerFn({ method: 'GET' })
  .handler(async () => {
    // 1. Fetch a safe sample using Drizzle
    const sampleSubmissions = await db
      .select()
      .from(formSubmissions)
      .where(isNotNull(formSubmissions.data))
      .limit(1000)

    const documents = sampleSubmissions.map((s) => s.data)

    // 2. Run the analysis algorithms from the guide
    const schemaProfile = profileFields(documents)

    return {
      records: sampleSubmissions,
      schemaProfile,
    }
  })

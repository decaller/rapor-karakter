import { createServerFn } from '@tanstack/react-start'
import { db } from '../db/index'
import { formSubmissions } from '../db/schema'
import { isNotNull, eq } from 'drizzle-orm'

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
    // 1. Fetch submissions using Drizzle
    const submissions = await db
      .select()
      .from(formSubmissions)
      .where(isNotNull(formSubmissions.data))
      .limit(1000)

    // 2. Group by sessionId
    const sessionMap = new Map<string, any>()
    
    for (const sub of submissions) {
      const sId = sub.sessionId || `legacy_${sub.id}` // Fallback for old records without sessionId
      if (!sessionMap.has(sId)) {
        sessionMap.set(sId, {
          id: sId, // Use sessionId as the table ID
          sessionId: sId,
          createdAt: sub.createdAt,
          formCount: 0,
          data: {}
        })
      }
      
      const session = sessionMap.get(sId)
      session.formCount += 1
      
      if (sub.data && typeof sub.data === 'object') {
        session.data = { ...session.data, ...sub.data }
      }
      
      // Use the earliest createdAt
      if (sub.createdAt && session.createdAt && sub.createdAt < session.createdAt) {
        session.createdAt = sub.createdAt
      }
    }

    const sessionRecords = Array.from(sessionMap.values())
    // Sort by newest first
    sessionRecords.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    const documents = sessionRecords.map((s) => s.data)

    // 3. Run the analysis algorithms on the merged session data
    const schemaProfile = profileFields(documents)

    return {
      records: sessionRecords,
      schemaProfile,
    }
  })

export const getSubmissionById = createServerFn({ method: 'GET' })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    const [submission] = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.id, id))
      .limit(1)
    
    return submission?.data || null
  })

export const getSubmissionsBySessionId = createServerFn({ method: 'GET' })
  .validator((sessionId: string) => sessionId)
  .handler(async ({ data: sessionId }) => {
    const submissions = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.sessionId, sessionId))
      
    // Merge all JSON payloads from this session into a single object
    const mergedData = submissions.reduce((acc, sub) => {
      if (sub.data && typeof sub.data === 'object') {
        return { ...acc, ...sub.data }
      }
      return acc
    }, {} as Record<string, unknown>)
    
    return mergedData
  })

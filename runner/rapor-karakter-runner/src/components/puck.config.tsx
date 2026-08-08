// Runner-side Puck config — imports schema from shared, adds React renderers.
import { reportComponentFields } from '@shared/reports/components/puck.config'
import type { Config } from '@puckeditor/core'
import { useReportData, resolvePlaceholders } from './ReportContext'
import { useSearch } from '@tanstack/react-router'

function HeadingBlockRender({ text, level }: { text: string; level: string }) {
    const data = useReportData()
    const resolvedText = resolvePlaceholders(text, data)
    const Tag = (`h${level}`) as React.ElementType
    return <Tag className="my-2 text-foreground font-heading font-bold">{resolvedText}</Tag>
}

function TextBlockRender({ content }: { content: string }) {
    const data = useReportData()
    const resolvedContent = resolvePlaceholders(content, data)
    return <p className="my-2 whitespace-pre-wrap text-foreground">{resolvedContent}</p>
}

function TableBlockRender({ caption, columns, rows }: { caption: string; columns: string; rows: string }) {
    const data = useReportData()
    const resolvedCaption = resolvePlaceholders(caption, data)
    const cols = columns.split(',').map((c) => resolvePlaceholders(c.trim(), data))
    const parsedRows = rows.split('\n').map((r) => r.split('|').map((c) => resolvePlaceholders(c.trim(), data)))

    return (
        <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-[0.9rem] text-foreground">
                {resolvedCaption ? <caption className="mb-1 font-semibold">{resolvedCaption}</caption> : null}
                <thead>
                    <tr>{cols.map((col) => <th key={col} className="border border-border bg-muted text-muted-foreground px-2.5 py-1.5 text-left">{col}</th>)}</tr>
                </thead>
                <tbody>
                    {parsedRows.map((row, ri) => (
                        <tr key={ri}>{cols.map((_, ci) => <td key={ci} className="border border-border px-2.5 py-1.5">{row[ci] ?? ''}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ImageBlockRender({ src, alt, width }: { src: string; alt: string; width: string }) {
    const data = useReportData()
    const resolvedSrc = resolvePlaceholders(src, data)
    
    return resolvedSrc ? (
        <img src={resolvedSrc} alt={alt} style={{ width }} className="my-2 block" />
    ) : (
        <div style={{ width, height: 120, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.85rem', margin: '0.5rem 0' }}>
            No image src
        </div>
    )
}

function QueryTableBlockRender({ paramName }: { paramName: string }) {
    const data = useReportData()
    const rawValue = data?.[paramName]

    if (!rawValue || typeof rawValue !== 'string') {
        return (
            <div style={{ margin: '0.5rem 0', padding: '1rem', border: '1px solid #ccc', background: '#f9fafb' }}>
                <p style={{ margin: 0, color: '#6b7280' }}>No data provided for parameter: <strong>{paramName}</strong></p>
            </div>
        )
    }

    const items = rawValue.split(',')

    return (
        <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid #ccc', padding: '0.4rem 0.6rem', background: '#f5f5f5', textAlign: 'left', width: '50px' }}>#</th>
                        <th style={{ border: '1px solid #ccc', padding: '0.4rem 0.6rem', background: '#f5f5f5', textAlign: 'left' }}>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td style={{ border: '1px solid #ccc', padding: '0.4rem 0.6rem' }}>{index}</td>
                            <td style={{ border: '1px solid #ccc', padding: '0.4rem 0.6rem' }}>{item}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const reportConfig: Config = {
    components: {
        HeadingBlock: { ...reportComponentFields.HeadingBlock, render: HeadingBlockRender as any },
        TextBlock: { ...reportComponentFields.TextBlock, render: TextBlockRender as any },
        TableBlock: { ...reportComponentFields.TableBlock, render: TableBlockRender as any },
        ImageBlock: { ...reportComponentFields.ImageBlock, render: ImageBlockRender as any },
        QueryTableBlock: { ...reportComponentFields.QueryTableBlock, render: QueryTableBlockRender as any },
    },
}

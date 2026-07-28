// Builder-side Puck config — imports schema from shared, adds React renderers.
import { reportComponentFields } from '@shared/reports/components/puck.config'
import type { Config } from '@puckeditor/core'

function HeadingBlockRender({ text, level }: { text: string; level: string }) {
    const Tag = (`h${level}`) as React.ElementType
    return <Tag style={{ margin: '0.5rem 0' }}>{text}</Tag>
}

function TextBlockRender({ content }: { content: string }) {
    return <p style={{ margin: '0.5rem 0', whiteSpace: 'pre-wrap' }}>{content}</p>
}

function TableBlockRender({ caption, columns, rows }: { caption: string; columns: string; rows: string }) {
    const cols = columns.split(',').map((c) => c.trim())
    const parsedRows = rows.split('\n').map((r) => r.split('|').map((c) => c.trim()))

    return (
        <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                {caption ? <caption style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{caption}</caption> : null}
                <thead>
                    <tr>{cols.map((col) => <th key={col} style={{ border: '1px solid #ccc', padding: '0.4rem 0.6rem', background: '#f5f5f5', textAlign: 'left' }}>{col}</th>)}</tr>
                </thead>
                <tbody>
                    {parsedRows.map((row, ri) => (
                        <tr key={ri}>{cols.map((_, ci) => <td key={ci} style={{ border: '1px solid #ccc', padding: '0.4rem 0.6rem' }}>{row[ci] ?? ''}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ImageBlockRender({ src, alt, width }: { src: string; alt: string; width: string }) {
    return src ? (
        <img src={src} alt={alt} style={{ width, display: 'block', margin: '0.5rem 0' }} />
    ) : (
        <div style={{ width, height: 120, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.85rem', margin: '0.5rem 0' }}>
            No image src
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
    },
}

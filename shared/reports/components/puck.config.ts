// Shared Puck report config schema — pure data, no JSX.
// Render functions are defined in each app's puck.config.tsx wrapper.

export const reportComponentFields = {
    HeadingBlock: {
        fields: {
            text: { type: 'text' as const },
            level: {
                type: 'radio' as const,
                options: [
                    { label: 'H1', value: '1' },
                    { label: 'H2', value: '2' },
                    { label: 'H3', value: '3' },
                ],
            },
        },
        defaultProps: { text: 'Heading', level: '1' },
    },
    TextBlock: {
        fields: {
            content: { type: 'textarea' as const },
        },
        defaultProps: { content: 'Enter text here...' },
    },
    TableBlock: {
        fields: {
            caption: { type: 'text' as const },
            columns: { type: 'text' as const },
            rows: { type: 'textarea' as const },
        },
        defaultProps: {
            caption: 'Table caption',
            columns: 'Name, Score, Grade',
            rows: 'Ali|90|A\nBudi|80|B',
        },
    },
    ImageBlock: {
        fields: {
            src: { type: 'text' as const },
            alt: { type: 'text' as const },
            width: { type: 'text' as const },
        },
        defaultProps: { src: '', alt: 'Image', width: '100%' },
    },
} as const

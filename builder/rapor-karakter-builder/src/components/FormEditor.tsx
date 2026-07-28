import { useState } from 'react'
import type { ICreatorOptions } from 'survey-creator-core'
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react'

const defaultCreatorOptions: ICreatorOptions = {
    autoSaveEnabled: true,
    collapseOnDrag: true,
}

// React 19 type compatibility cast for survey-creator-react class component
const SurveyCreatorUI = SurveyCreatorComponent as unknown as React.ComponentType<{
    creator: SurveyCreator
    style?: React.CSSProperties
}>

export function SurveyCreatorWidget(props: { json?: object; options?: ICreatorOptions }) {
    const [creator] = useState(() => new SurveyCreator(props.options || defaultCreatorOptions))

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <SurveyCreatorUI creator={creator} />
        </div>
    )
}
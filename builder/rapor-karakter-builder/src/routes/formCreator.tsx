import { createFileRoute } from '@tanstack/react-router'
import { SurveyCreatorWidget } from '#/components/FormEditor'

export const Route = createFileRoute('/formCreator')({
    component: FormCreator,
})

function FormCreator() {
    return <SurveyCreatorWidget />
}
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/form/$formId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/form/$formId"!</div>
}

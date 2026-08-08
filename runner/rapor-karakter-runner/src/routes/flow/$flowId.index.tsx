import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/flow/$flowId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/flow/$flowId/step/$stepIndex',
      params: { flowId: params.flowId, stepIndex: '0' },
    })
  },
  component: () => null,
})

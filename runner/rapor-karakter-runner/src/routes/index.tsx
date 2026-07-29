import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { setCookie } from '@tanstack/react-start/server'

const loginAction = createServerFn({ method: 'POST' })
  .validator((password: string) => password)
  .handler(async ({ data: password }) => {
    if (password === process.env.APP_PASSWORD) {
      setCookie('auth', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30 }) // 30 days
      return { success: true }
    }
    return { success: false }
  })

export const Route = createFileRoute('/')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    try {
      const result = await loginAction({ data: password })
      if (result.success) {
        router.navigate({ to: '/dashboard' })
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-20 flex justify-center items-center h-[70vh]">
      <div className="island-shell w-full max-w-sm rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)] mb-6 text-center">Login to Rapor Karakter</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              className="demo-input w-full"
              autoFocus
            />
          </div>
          
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="demo-button w-full justify-center disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </main>
  )
}

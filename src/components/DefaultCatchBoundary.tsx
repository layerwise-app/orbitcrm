import {
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { BrandMark } from '~/components/brand'
import { Button } from '~/components/ui/button'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error(error)

  return (
    <main className="status-page">
      <BrandMark size={28} />
      <h1>Something went wrong</h1>
      <p className="status-text">
        An unexpected error interrupted this page. Try again, or head back.
      </p>
      {error instanceof Error && error.message ? (
        <pre className="status-detail">{error.message}</pre>
      ) : null}
      <div className="status-actions">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            router.invalidate()
          }}
        >
          Try again
        </Button>
        {isRoot ? (
          <Button asChild size="lg">
            <Link to="/">Go to home</Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault()
                window.history.back()
              }}
            >
              Go back
            </Link>
          </Button>
        )}
      </div>
    </main>
  )
}

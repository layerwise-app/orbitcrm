import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { BrandMark } from '~/components/brand'
import { Button } from '~/components/ui/button'

export function NotFound({ children }: { children?: ReactNode }) {
  return (
    <main className="status-page">
      <BrandMark size={28} />
      <span className="status-code tnum">404</span>
      <h1>Page not found</h1>
      <div className="status-text">
        {children || <p>This page doesn’t exist or has moved.</p>}
      </div>
      <div className="status-actions">
        <Button variant="outline" size="lg" onClick={() => window.history.back()}>
          Go back
        </Button>
        <Button asChild size="lg">
          <Link to="/">Go to home</Link>
        </Button>
      </div>
    </main>
  )
}

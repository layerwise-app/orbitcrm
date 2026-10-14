import { Link } from '@tanstack/react-router';

/** Orbit's mark: an ink ring with a vermilion satellite. */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg className='brand-mark' width={size} height={size} viewBox='0 0 20 20' fill='none' aria-hidden='true'>
      <circle cx='9' cy='11' r='6.25' stroke='currentColor' strokeWidth='2.5' />
      <circle cx='15.5' cy='4.5' r='3' fill='var(--vermilion)' />
    </svg>
  );
}

export function BrandLink({ className = '' }: { className?: string }) {
  return (
    <Link to='/' className={`brand ${className}`} aria-label='Orbit CRM home'>
      <BrandMark />
      <span>Orbit</span>
    </Link>
  );
}

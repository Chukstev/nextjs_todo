import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TodoNav() {
  const pathname = usePathname()

  const links = [
    { href: '/todos', label: 'All' },
    { href: '/todos/pending', label: 'Pending' },
    { href: '/todos/completed', label: 'Completed' }
  ]

  return (
    <div className='nav-links'>
      {links.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              backgroundColor: isActive ? 'black' : 'white',
              color: isActive ? 'white' : 'black',
              padding: '0.3rem',
              borderRadius: '5px',
              textDecoration: 'none'
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

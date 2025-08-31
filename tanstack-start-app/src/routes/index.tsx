import * as fs from 'node:fs'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const filePath = 'count.txt'

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
  )
}

const getCount = createServerFn({
  method: 'GET',
}).handler(() => {
  return readCount()
})

const updateCount = createServerFn({ method: 'POST' })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount()
    await fs.promises.writeFile(filePath, `${count + data}`)
  })

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => await getCount(),
})

function Home() {
  const router = useRouter()
  const state = Route.useLoaderData()

  const cardStyles: React.CSSProperties = {
    background: '#2a2a2a',
    border: '1px solid #404040',
    borderRadius: '0',
    padding: '4rem 6rem',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none',
  }

  const counterStyles: React.CSSProperties = {
    fontSize: '4rem',
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Fira Code, monospace',
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
  }

  const linkStyles: React.CSSProperties = {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '0.75rem 1.5rem',
    background: '#333333',
    border: '1px solid #505050',
    fontFamily: 'Fira Code, monospace',
    fontSize: '1rem',
    transition: 'all 0.2s',
    display: 'inline-block',
  }

  return (
    <div style={containerStyles}>
      <div 
        style={cardStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#333333'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '6px 6px 0px rgba(0, 0, 0, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#2a2a2a'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.3)'
        }}
        onClick={() => {
          updateCount({ data: 1 }).then(() => {
            router.invalidate()
          })
        }}
      >
        <div style={counterStyles}>{state}</div>
      </div>
      
      <Link 
        to="/git-history" 
        style={linkStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#444444'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#333333'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        View Git History
      </Link>
    </div>
  )
}
import { useState } from 'react'

export function App() {
  const [count, setCount] = useState(0)

  return (
    <main style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <h1>Resultado Eleições</h1>
      <p style={{ color: '#64748b' }}>
        Projeto React com Vite e TypeScript configurado com sucesso!
      </p>
      
      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '1px solid #0284c7',
            background: '#0284c7',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Contagem: {count}
        </button>
      </div>
    </main>
  )
}

export default App

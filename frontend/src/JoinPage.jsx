import { useState } from 'react'

export default function JoinPage({ onJoin }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) return

    onJoin(trimmedName)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <h2 style={{ margin: 0 }}>Join Meeting</h2>

        <label htmlFor="name">Your name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          style={{
            padding: 10,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #ccc'
          }}
        />

        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: 'none',
            cursor: name.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Join Meeting
        </button>
      </form>
    </div>
  )
}
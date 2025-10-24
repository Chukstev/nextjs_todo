'use client'
import { useEffect, useState } from 'react'
import Pusher from 'pusher-js'

interface Message {
  user: string
  message: string
  timestamp: string
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [username, setUsername] = useState('Anonymous')
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_PUSHER_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      console.error('Pusher environment variables are not set')
      return
    }

    // Connect to Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      forceTLS: true
    })

    const channel = pusher.subscribe('todo-chat')

    channel.bind('new-message', (data: Message) => {
      setMessages(prev => [...prev, data])
    })
    return () => {
      pusher.unsubscribe('todo-chat')
      pusher.disconnect()
    }
  }, [])
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: username,
        message: input
      })
    })

    setInput('')
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px'
      }}
    >
      <h3 style={{ margin: '0 0 15px 0' }}>Live Chat</h3>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '15px',
          background: '#fafafa',
          minHeight: '200px',
          maxHeight: 'calc(100vh - 250px)'
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '8px', wordBreak: 'break-word' }}>
            <strong>{msg.user}</strong>: {msg.message}
            <span
              style={{
                fontSize: '0.8em',
                color: 'gray',
                marginLeft: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}
      >
        <input
          type='text'
          placeholder='Your name'
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            flex: 1,
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '4px',
            minWidth: 0
          }}
        />
        <input
          type='text'
          placeholder='Type a message...'
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            flex: 2,
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '4px',
            minWidth: 0
          }}
        />
        <button
          type='submit'
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontWeight: 'bold'
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

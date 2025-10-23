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
  const [username, setUsername] = useState("Anonymous")
  useEffect (() => {
    // Connect to Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!, 
    })
    const channel = pusher.subscribe("todo-chat")
    channel.bind("new-message", (data: Message) => {
        setMessages((prev => [...prev, data]))
    })
    return () => {
        pusher.unsubscribe("todo-chat")
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
        message: input,
      }),
    })

    setInput('')
  }
return (
    <div
      style={{
        borderTop: '1px solid lightgray',
        paddingTop: '10px',
        marginTop: '20px',
        width: '100%',
        maxWidth: '600px'
      }}
    >
      <h3>Live Chat</h3>
      <div
        style={{
          height: '250px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '10px',
          background: '#fafafa',
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '5px' }}>
            <strong>{msg.user}</strong>: {msg.message}
            <span style={{ fontSize: '0.8em', color: 'gray', marginLeft: '8px' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type='text'
          placeholder='Your name'
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            flex: 1,
            border: '1px solid #ccc',
            padding: '5px',
            borderRadius: '4px',
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
            padding: '5px',
            borderRadius: '4px',
          }}
        />
        <button
          type='submit'
          style={{
            background: 'blue',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

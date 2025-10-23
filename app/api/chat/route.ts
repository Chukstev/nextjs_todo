import { NextResponse } from 'next/server'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: Request) {
  const body = await req.json()
  const { user, message } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is empty' }, { status: 400 })
  }

  await pusher.trigger('todo-chat', 'new-message', {
    user,
    message,
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ success: true })
}
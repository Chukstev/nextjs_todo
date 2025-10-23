import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect root to /todos
  redirect('/todos')
}

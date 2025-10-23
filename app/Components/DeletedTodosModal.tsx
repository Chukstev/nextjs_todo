'use client'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

interface DeletedTodo {
  id: number
  title: string
  deletedAt?: string
  originalIndex?: number
}
interface DeletedTodosModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DeletedTodosModal({
  isOpen,
  onClose
}: DeletedTodosModalProps) {
  const [deletedTodos, setDeletedTodos] = useState<DeletedTodo[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false)

  useEffect(() => {
    const stored = localStorage.getItem('deletedTodos')
    if (stored) setDeletedTodos(JSON.parse(stored))
  }, [isOpen])
  const queryClient = useQueryClient()

  if (!isOpen) return null

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const restoreSelected = () => {
    const storedTodos: any[] = JSON.parse(localStorage.getItem('todos') || '[]')
    const toRestore = deletedTodos.filter(todo => selectedIds.includes(todo.id))
    const remaining = deletedTodos.filter(
      todo => !selectedIds.includes(todo.id)
    )
    localStorage.setItem(
      'todos',
      JSON.stringify([...storedTodos, ...toRestore])
    )
    localStorage.setItem('deletedTodos', JSON.stringify(remaining))
    setDeletedTodos(remaining)
    setSelectedIds([])

    queryClient.setQueryData(['todos'], [...storedTodos, ...toRestore])
  }
  const permanentlyDeleteSelected = () => {
    if (selectedIds.length === 0) return
    setConfirmDelete(true)
  }

  const confirmPermanentDelete = () => {
    const remaining = deletedTodos.filter(
      todo => !selectedIds.includes(todo.id)
    )
    localStorage.setItem('deletedTodos', JSON.stringify(remaining))
    setDeletedTodos(remaining)
    setSelectedIds([])
    setConfirmDelete(false)
  }
  const cancelDelete = () => {
    setConfirmDelete(false)
  }
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80%',
          overflowY: 'auto'
        }}
      >
        <h2>Deleted Todos</h2>
        <button
          onClick={onClose}
          style={{
            float: 'right',
            color: 'red',
            border: 'none',
            padding: '8px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Close ✖
        </button>

        {deletedTodos.length === 0 ? (
          <p>No deleted todos</p>
        ) : (
          <>
            {confirmDelete ? (
              <div
                style={{ textAlign: 'center', padding: '20px', width: '80%' }}
              >
                <p>
                  Are you sure you want to permanently delete the selected
                  todos?
                </p>
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={confirmPermanentDelete}
                    style={{
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={cancelDelete}
                    style={{
                      background: 'gray',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}
                >
                  <button
                    onClick={restoreSelected}
                    style={{
                      border: 'none',
                      padding: '8px',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Restore Selected
                  </button>
                  <button
                    onClick={permanentlyDeleteSelected}
                    style={{
                      marginLeft: '10px',
                      color: 'red',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete Permanently
                  </button>
                </div>
              </>
            )}

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {deletedTodos.map(todo => (
                <li
                  key={todo.id}
                  style={{
                    border: '1px dotted lightgray',
                    margin: '8px 0',
                    padding: '8px',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type='checkbox'
                    checked={selectedIds.includes(todo.id)}
                    onChange={() => toggleSelect(todo.id)}
                  />
                  <span style={{ marginLeft: '10px' }}>{todo.title}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

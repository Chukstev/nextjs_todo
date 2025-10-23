'use client'

import React, { useState } from 'react'
import axios from 'axios'
import Pagination from '../Components/Pagination'
import ErrorBoundary from '../Components/ErrorBoundary'
import LoadingSpinner from '../Components/Spinner/LoadingSpinner'
import { FaTrash, FaPlus, FaComment, FaWindowClose } from 'react-icons/fa'
import { MdVisibility } from 'react-icons/md'
import TodoModal from '../Components/TodoModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo } from '../types'
import TodoNav from '../Components/TodoNav'
import DeletedTodosModal from '../Components/DeletedTodosModal'
import ChatBox from '../Components/ChatBox'

type TodoListProps = {
  todos: Todo[]
  toggleTodo: (id: number, completed: boolean) => void
  handleDelete: (id: number) => void
  currentPage: number
  todosPerPage: number
  setCurrentPage: (page: number) => void
  setSelectedTodo: (todo: Todo) => void
}

const TodoList: React.FC<TodoListProps> = ({
  todos,
  toggleTodo,
  handleDelete,
  currentPage,
  todosPerPage,
  setCurrentPage,
  setSelectedTodo
}) => {
  const lastPageIndex = currentPage * todosPerPage
  const firstPageIndex = lastPageIndex - todosPerPage
  const currentTodoPage = todos.slice(firstPageIndex, lastPageIndex)

  return (
    <>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {currentTodoPage.map(todo => (
          <li
            key={todo.id}
            style={{
              margin: '10px 0',
              border: todo.completed ? '1px solid black' : '0.5px solid grey'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                className='checkbox'
                type='checkbox'
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
              />
              <span
                style={{
                  marginLeft: '8px',
                  opacity: todo.completed ? '70%' : '100%'
                }}
              >
                {todo.title}
              </span>
            </label>
            <div className='vd'>
              <button
                className='view-btn'
                onClick={() => setSelectedTodo(todo)}
              >
                <MdVisibility size={20} />
              </button>
              <button
                className='del-btn'
                onClick={() => handleDelete(todo.id)}
                aria-label={`Delete ${todo.title}`}
              >
                <FaTrash size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Pagination
        totalTodos={todos.length}
        todosPerPage={todosPerPage}
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
      />
    </>
  )
}

const AllTodos: React.FC<TodoListProps> = props => <TodoList {...props} />

const CompletedList: React.FC<TodoListProps> = props => {
  const completed = props.todos.filter(todo => todo.completed)
  const totalPages = Math.ceil(completed.length / props.todosPerPage)
  if (props.currentPage > totalPages && totalPages !== 0) {
    throw new Error('Page not found for completed todos')
  }
  return <TodoList {...props} todos={completed} />
}

const PendingList: React.FC<TodoListProps> = props => {
  const pending = props.todos.filter(todo => !todo.completed)
  const totalPages = Math.ceil(pending.length / props.todosPerPage)
  if (props.currentPage > totalPages && totalPages !== 0) {
    throw new Error('Page not Found for pending todos')
  }
  return <TodoList {...props} todos={pending} />
}
const CompletedTodos: React.FC<TodoListProps> = props => (
  <ErrorBoundary type='completed'>
    <CompletedList {...props} />
  </ErrorBoundary>
)

const PendingTodos: React.FC<TodoListProps> = props => (
  <ErrorBoundary type='pending'>
    <PendingList {...props} />
  </ErrorBoundary>
)
interface ClientTodosProps {
  filter?: 'all' | 'completed' | 'pending'
}
export default function ClientTodos({ filter = 'all' }: ClientTodosProps) {
  const [newTitle, setNewTitle] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [alertMessage, setAlertMessage] = useState<string>('')
  const [deletedTodos, setDeletedTodos] = useState<Todo[]>([])
  const [todosPerPage, setTodosPerPage] = useState<number>(10)
  const [showDeletedModal, setShowDeletedModal] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const queryClient = useQueryClient()

  const fetchTodos = async (): Promise<Todo[]> => {
    const localData = localStorage.getItem('todos')
    const deletedData = localStorage.getItem('deletedTodos')
    if (deletedData) setDeletedTodos(JSON.parse(deletedData))
    if (localData) {
      return JSON.parse(localData) as Todo[]
    } else {
      const response = await axios.get<Todo[]>(
        'https://jsonplaceholder.typicode.com/todos'
      )
      localStorage.setItem('todos', JSON.stringify(response.data))
      return response.data
    }
  }
  const updateLocalStorage = (updatedTodos: Todo[]) => {
    localStorage.setItem('todos', JSON.stringify(updatedTodos))
  }
  const {
    data: todos = [],
    isLoading,
    isError
  } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: fetchTodos
  })
  const filteredTodos = todos
    .filter(todo => todo.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(todo => {
      if (filter === 'completed') return todo.completed //f for completed
      if (filter === 'pending') return !todo.completed // for pending
      return true // for all
    })

  // ---- Mutations ----
  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      axios.patch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
        completed
      }),
    onSuccess: (_, { id, completed }) => {
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos = []) => {
        const updatedTodos = oldTodos.map(todo =>
          todo.id === id ? { ...todo, completed } : todo
        )
        updateLocalStorage(updatedTodos) // update localStorage here
        return updatedTodos
      })
    },
    onError: error => {
      console.error('Toggle failed:', error)
      setAlertMessage('Failed to update todo status 😢')
    }
  })

  const toggleTodo = (id: number, currentStatus: boolean) => {
    toggleMutation.mutate({ id, completed: !currentStatus })
  }

  // delete todo
  const deleteTodo = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`https://jsonplaceholder.typicode.com/todos/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos = []) => {
        const updatedTodos = oldTodos.filter(todo => todo.id !== id)
        updateLocalStorage(updatedTodos)
        return updatedTodos
      })
    },
    onError: error => {
      console.error('Toggle failed:', error)
      setAlertMessage('Failed to delete todo 😢')
    }
  })

  const handleDelete = (id: number) => {
    // deleteTodo.mutate(id)
    queryClient.setQueryData<Todo[]>(['todos'], (oldTodos = []) => {
      const todoToDelete = oldTodos.find(todo => todo.id === id)
      if (!todoToDelete) return oldTodos
      const updatedTodos = oldTodos.filter(todo => todo.id !== id)
      const existingDeleted = JSON.parse(
        localStorage.getItem('deletedTodos') || '[]'
      )
      const updatedDeleted = [
        ...existingDeleted,
        { ...todoToDelete, deletedAt: new Date().toISOString() }
      ]
      localStorage.setItem('deletedTodos', JSON.stringify(updatedDeleted))
      setDeletedTodos(updatedDeleted)
      updateLocalStorage(updatedTodos)
      localStorage.setItem('deletedTodos', JSON.stringify(updatedDeleted))

      return updatedTodos
    })
  }

  // add a new todo
  const addTodo = useMutation({
    mutationFn: (newTodo: Todo) => Promise.resolve(newTodo),
    onSuccess: (_, newTodo: Todo) => {
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos?: Todo[]) => {
        const updatedTodos: Todo[] = [newTodo, ...(oldTodos ?? [])]
        updateLocalStorage(updatedTodos)
        return updatedTodos
      })
      setNewTitle('')
    },
    onError: error => {
      console.error('Toggle failed:', error)
      setAlertMessage('Failed to add todo 😢')
    }
  })

  // edit todo
  const editTodo = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      axios.patch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
        title
      }),
    onSuccess: (_, { id, title }) => {
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos = []) => {
        const updatedTodos = oldTodos.map(todo =>
          todo.id === id ? { ...todo, title } : todo
        )
        updateLocalStorage(updatedTodos)
        return updatedTodos
      })
    },
    onError: error => {
      console.error('Toggle failed:', error)
      setAlertMessage('Failed to edit todo 😢')
    }
  })

  const handleAdd = () => {
    if (!newTitle.trim()) return // Prevent adding empty todos
    const newTodo: Todo = {
      userId: 1,
      id: Date.now(), // Using current timestamp as a unique ID
      title: newTitle,
      completed: false
    }
    addTodo.mutate(newTodo)
  }

  return (
    <div>
      <main className='Todo-list'>
        <section className='input-container'>
          <nav className='navbar'>
            <input
              type='search'
              placeholder='Search...'
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
            />
          </nav>
          <h1 style={{ fontSize: '3rem' }}>Todo List</h1>
          <div
            aria-live='polite'
            style={{ marginBottom: '10px', fontSize: '1.5rem' }}
          >
            {todos.length} todos remaining
          </div>
          <div>
            <label htmlFor='new-todo'>Add a new todo: </label>
            <br />
            <input
              id='new-todo'
              type='text'
              value={newTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTitle(e.target.value)
              }
              placeholder='Enter new todo'
              className='add-todo'
            />
            <button className='addTodo' onClick={handleAdd}>
              <FaPlus /> Add
            </button>
          </div>
        </section>
        <section className='navigation' style={{ marginBottom: '20px' }}>
          <TodoNav />
          <div
            style={{
              display: 'flex',
              position: 'fixed',
              zIndex: 1000,
              bottom: 10,
              width: '100%',
              gap: '10px',
              marginTop: '10px'
            }}
          >
            {' '}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {' '}
              <div>
                <button
                  onClick={() => setShowDeletedModal(true)}
                  style={{
                    color: 'red',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'grey',
                    padding: '8px',
                    borderRadius: '5px'
                  }}
                >
                  View Deleted Todos
                </button>
              </div>
              <div>
                <button
                  onClick={() => setShowChat(prev => !prev)}
                  style={{
                    color: 'white',
                    backgroundColor: showChat ? 'red' : 'blue',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '5px'
                  }}
                >
                  {showChat ? <FaWindowClose /> : <FaComment />}
                </button>
              </div>
            </div>
          </div>
          {isLoading && <LoadingSpinner />}
          {isError && (
            <div style={{ color: 'red' }}>
              Failed to load todos.{' '}
              <button
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['todos'] })
                }
              >
                Retry
              </button>
            </div>
          )}
          {!isLoading && filteredTodos.length === 0 && (
            <p
              style={{
                color: 'red',
                marginBlock: '20px',
                fontSize: '2rem',
                textAlign: 'center',
                width: '100%'
              }}
            >
              No todos found for your "{searchTerm}"
            </p>
          )}
          <div>
            <AllTodos
              todos={filteredTodos}
              toggleTodo={toggleTodo}
              handleDelete={handleDelete}
              currentPage={currentPage}
              todosPerPage={todosPerPage}
              setCurrentPage={setCurrentPage}
              setSelectedTodo={setSelectedTodo}
            />
          </div>
          <TodoModal
            todo={selectedTodo}
            onClose={() => setSelectedTodo(null)}
            handleDelete={handleDelete}
            editTodo={editTodo}
          />
        </section>
        {showChat && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '80%',
                overflowY: 'auto',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setShowChat(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'red',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✖
              </button>
              <ChatBox />
            </div>
          </div>
        )}
      </main>
      <DeletedTodosModal
        isOpen={showDeletedModal}
        onClose={() => setShowDeletedModal(false)}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/LoginForm'
import Recommend from './components/Recommend'
import { useApolloClient, useQuery } from '@apollo/client'
import { ALL_BOOKS } from './queries'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)
  // const result = useQuery(ALL_BOOKS)
  const client = useApolloClient()
  const logout = () => {
    setToken(null)
    client.resetStore()
    localStorage.clear()
  }

  useEffect(() => {
    setToken(localStorage.getItem('library-user-token'))
  }, [])

  // if (result.loading) return <div>loading...</div>

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {token ? (
          <>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={() => setPage('recommend')}>
              Recommendations
            </button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage('login')}>login</button>
        )}
      </div>

      <Authors show={page === 'authors'} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} />

      <Recommend show={page === 'recommend'} />

      <Login show={page === 'login'} setToken={setToken} setPage={setPage} />
    </div>
  )
}

export default App

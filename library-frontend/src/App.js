import { useEffect, useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Login from './components/LoginForm'
import Recommend from './components/Recommend'
import './App.scss'
import { useApolloClient, useSubscription } from '@apollo/client'
import { ALL_BOOKS, BOOK_ADDED, GENRES, ALL_AUTHORS } from './queries'

export const updateCache = (cache, query, bookAdded) => {
  const uniqByTitle = (a) => {
    let seen = new Set()
    return a.filter((item) => {
      const k = item.title
      return seen.has(k) ? false : seen.add(k)
    })
  }

  const uniqByName = (a) => {
    let seen = new Set()
    return a.filter((item) => {
      return seen.has(item.name) ? false : seen.add(item.name)
    })
  }

  cache.updateQuery({ query: ALL_AUTHORS }, ({ allAuthors }) => {
    return {
      allAuthors: uniqByName(allAuthors.concat(bookAdded.author)),
    }
  })

  if (
    cache.readQuery({
      query: ALL_BOOKS,
    })
  ) {
    cache.updateQuery(query, ({ allBooks }) => {
      return {
        allBooks: uniqByTitle(allBooks.concat(bookAdded)),
      }
    })
    bookAdded.genres.forEach((genre) => {
      if (cache.readQuery({ query: ALL_BOOKS, variables: { genre } })) {
        cache.updateQuery(
          { query: ALL_BOOKS, variables: { genre } },
          ({ allBooks }) => {
            return {
              allBooks: uniqByTitle(allBooks.concat(bookAdded)),
            }
          }
        )
      }
    })
    cache.updateQuery({ query: GENRES }, ({ allGenres }) => {
      return {
        allGenres: [
          ...new Set(
            allGenres.concat(bookAdded.genres).flatMap((genre) => genre)
          ),
        ],
      }
    })
  }
}

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)
  const client = useApolloClient()
  const logout = () => {
    setToken(null)
    client.resetStore()
    localStorage.clear()
  }

  useEffect(() => {
    setToken(localStorage.getItem('library-user-token'))
  }, [])

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const bookAdded = subscriptionData.data.bookAdded
      if (page === 'books') {
        window.alert(`${bookAdded.title} added by ${bookAdded.author.name}`)
      }
      updateCache(client.cache, { query: ALL_BOOKS }, bookAdded)
    },
  })

  return (
    <div className="main">
      <div className="buttons">
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

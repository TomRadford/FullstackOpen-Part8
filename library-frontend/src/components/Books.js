import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS, GENRES } from '../queries'

const Books = (props) => {
  const [filter, setFilter] = useState(null)
  const getOptions = () => {
    let opts = { skip: !props.show }
    if (filter) {
      opts.variables = {
        genre: filter,
      }
    }
    return opts
  }
  const booksResult = useQuery(ALL_BOOKS, getOptions())
  const genresResult = useQuery(GENRES, {
    skip: !props.show,
  })
  if (!props.show) {
    return null
  }
  if (booksResult.loading || genresResult.loading) return <div>loading...</div>
  const books = booksResult.data.allBooks
  const genres = genresResult.data.allGenres

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {genres.map((genre) => (
        <button
          disabled={genre === filter}
          onClick={() => setFilter(genre)}
          key={genre}
        >
          {genre}
        </button>
      ))}
      <button disabled={!filter} onClick={() => setFilter(null)}>
        All genres
      </button>
    </div>
  )
}

export default Books

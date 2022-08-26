import { useQuery } from '@apollo/client'
import { useState, useEffect } from 'react'
import { ME } from '../queries'
import { ALL_BOOKS } from '../queries'

const Recommend = (props) => {
  const [genre, setGenre] = useState(null)
  const meResult = useQuery(ME, {
    skip: !props.show,
  })

  const booksResult = useQuery(ALL_BOOKS, {
    skip: !props.show,
    variables: { genre },
  })

  useEffect(() => {
    if (meResult.data) {
      setGenre(meResult.data.me.favouriteGenre)
    }
  }, [meResult.data]) //eslint-disable-line

  if (!props.show) return null
  if (booksResult.loading) return <div>loading...</div>

  const books = booksResult.data.allBooks

  return (
    <div>
      <h2>Recommendations</h2>
      <p>
        books in your favorite genre <b>{genre}</b>
      </p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommend

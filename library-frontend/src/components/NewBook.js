import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_BOOK, ALL_BOOKS, GENRES } from '../queries'

const NewBook = (props) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])

  const [createBook] = useMutation(CREATE_BOOK, {
    // refetchQueries: { ALL_BOOKS, GENRES },
    onError: (e) => {
      console.log(e)
      console.log(e.graphQLErrors[0].message)
    },
    update: (cache, response) => {
      console.log(response)
      cache.updateQuery({ query: ALL_BOOKS }, ({ allBooks }) => {
        console.log(response)
        console.log(allBooks)
        return {
          allBooks: allBooks.concat(response.data.addBook),
        }
      })
      response.data.addBook.genres.forEach((genre) => {
        cache.updateQuery(
          { query: ALL_BOOKS, variables: { genre } },
          ({ allBooks }) => {
            return {
              allBooks: allBooks.concat(response.data.addBook),
            }
          }
        )
      })
      cache.updateQuery({ query: GENRES }, ({ allGenres }) => {
        return {
          allGenres: [
            ...new Set(
              allGenres
                .concat(response.data.addBook.genres)
                .flatMap((genre) => genre)
            ),
          ],
        }
      })
    },
  })

  if (!props.show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    if (genres) {
      createBook({
        variables: {
          title,
          author,
          published: parseInt(published),
          genres,
        },
      })
    }

    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  )
}

export default NewBook

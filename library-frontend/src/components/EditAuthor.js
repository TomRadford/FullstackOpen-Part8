import { useMutation } from '@apollo/client'
import { EDIT_AUTHOR } from '../queries'
import { useEffect, useState } from 'react'

const EditAuthor = ({ authors }) => {
  const [changeYear, result] = useMutation(EDIT_AUTHOR)
  const [selected, setSelected] = useState('initial')

  const submit = (e) => {
    e.preventDefault()
    changeYear({
      variables: {
        name: e.target.name.value,
        setBornTo: parseInt(e.target.year.value),
      },
    })
    setSelected('initial')
    e.target.year.value = null
  }

  const handleSelected = (e) => {
    setSelected(e.target.value)
  }

  useEffect(() => {
    if (result.data && result.data.editAuthor === null) {
      alert('No user found')
    }
  }, [result.data])

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={submit}>
        <select name="name" value={selected} onChange={handleSelected}>
          <option value="initial">Please select a author</option>
          {authors.map((author) => (
            <option
              onSelect={handleSelected}
              key={author.id}
              value={author.name}
            >
              {author.name}
            </option>
          ))}
        </select>
        <div>
          year <input name="year" type="number"></input>
        </div>
        <button type="submit">Update author</button>
      </form>
    </div>
  )
}

export default EditAuthor

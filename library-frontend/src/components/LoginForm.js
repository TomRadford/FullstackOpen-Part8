import { useMutation } from '@apollo/client'
import { LOGIN } from '../queries'
import { useEffect, useState } from 'react'
const Login = (props) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [login, result] = useMutation(LOGIN, {
    onError: (e) => console.log(e.graphQLErrors[0].message),
  })

  useEffect(() => {
    if (result.data) {
      const token = result.data.login.value
      props.setToken(token)
      localStorage.setItem('library-user-token', token)
      setUsername('')
      setPassword('')
      props.setPage('authors')
    }
  }, [result.data]) //eslint-disable-line

  const handleLogin = (e) => {
    e.preventDefault()
    login({
      variables: {
        username,
        password,
      },
    })
  }

  if (!props.show) {
    return null
  }

  return (
    <div>
      <br />
      <form onSubmit={handleLogin}>
        username
        <input
          type="text"
          onChange={({ target }) => setUsername(target.value)}
          value={username}
        />
        <br />
        password
        <input
          type="password"
          onChange={({ target }) => setPassword(target.value)}
          value={password}
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login

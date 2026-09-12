function toRandomPost() {
  const currentPath = window.location.pathname

  fetch('/post_list.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch post list')
      }
      return response.json()
    })
    .then(postPaths => {
      if (!postPaths || postPaths.length === 0) {
        alert('No posts available')
        return
      }

      let randomIndex
      let randomPath
      let attempts = 0
      const maxAttempts = 10

      do {
        randomIndex = Math.floor(Math.random() * postPaths.length)
        randomPath = postPaths[randomIndex]
        attempts++
      } while (randomPath === currentPath && attempts < maxAttempts && postPaths.length > 1)

      if (randomPath === currentPath) {
        alert('You are already on a random post!')
        return
      }

      window.location.href = randomPath
    })
    .catch(error => {
      console.error('Error fetching post list:', error)
      alert('Failed to load post list. Please try again later.')
    })
}

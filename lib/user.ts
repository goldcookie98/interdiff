const ID_KEY = 'intediff_user_id'
const NAME_KEY = 'intediff_username'

export function getUserId(): string {
  let id = localStorage.getItem(ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ID_KEY, id)
  }
  return id
}

export function getUsername(): string | null {
  return localStorage.getItem(NAME_KEY)
}

export function setUsername(name: string): void {
  localStorage.setItem(NAME_KEY, name.trim())
}

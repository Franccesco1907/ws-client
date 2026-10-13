import { Manager, Socket } from 'socket.io-client'

let socket: Socket

export const connectToServer = (token: string) => {

  const manager = new Manager('http://127.0.0.1:3000/socket.io/socket.io.js', {
    extraHeaders: {
      hola: 'mundo',
      authentication: token,
    }
  })
  socket?.removeAllListeners()
  socket = manager.socket('/')

  addListeners()
}

const addListeners = () => {
  const serverStatusLabel = document.querySelector('#server-status')!
  const clientsUl = document.querySelector('#clients-ul')!

  const messageForm = document.querySelector<HTMLFormElement>('#message-form')!
  const messageInput = document.querySelector<HTMLInputElement>('#message-input')!
  const messageUl = document.querySelector<HTMLUListElement>('#messages-ul')!

  socket.on('connect', () => {
    serverStatusLabel.innerHTML = 'Connected'
  })

  socket.on('disconnect', () => {
    serverStatusLabel.innerHTML = 'Disconnected'
  })

  socket.on('clients-updated', (clients: string[]) => {
    clientsUl.replaceChildren()
    clients.forEach(clientId => {
      const li = document.createElement('li')
      li.textContent = clientId
      clientsUl.append(li)
    })
  })

  messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    if (messageInput.value.trim().length <= 0) return

    socket.emit('message-from-client', {
      id: 'Yo!',
      message: messageInput.value,
    })

    messageInput.value = ''
  })

  socket.on('message-from-server', (payload: { fullName: string, message: string }) => {
    const li = document.createElement('li')
    const name = document.createElement('strong')
    name.textContent = payload.fullName
    const message = document.createElement('span')
    message.textContent = payload.message
    li.append(name, ' ', message)
    messageUl.append(li)
  })
}

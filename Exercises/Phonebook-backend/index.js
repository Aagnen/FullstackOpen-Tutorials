require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist')) //use static frontend
app.use(express.json())
app.use(cors())

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}  

morgan.token('postBody', (req, res) => {
    return req.method === 'POST' ? JSON.stringify(req.body) : '';
});
app.use(morgan(':method :url :response-time :postBody'));

const errorHandler = (err, req, res, next) => {
    // console.log(`Found error: ${err.message}`) // does the same
    console.error(err.message)
    if (err.name === 'CastError') {
        return res.status(400).send({ error: 'malformatted id' })
    } else if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message })
    }
    next(err)
}

//#region local database
// let data = [
    // { 
    //   "id": 1,
    //   "name": "Arto Hellas", 
    //   "number": "040-123456"
    // },
    // { 
    //   "id": 2,
    //   "name": "Ada Lovelace", 
    //   "number": "39-44-5323523"
    // },
    // { 
    //   "id": 3,
    //   "name": "Dan Abramov", 
    //   "number": "12-43-234345"
    // },
    // { 
    //   "id": 4,
    //   "name": "Mary Poppendieck", 
    //   "number": "39-23-6423122"
    // }
// ]
// app.get('/', (request, response) => {
//     response.send('<h1>Hello!</h1>')
// })
// app.get('/api/persons', (request, response) => {
//     response.json(data)
// })
// app.get('/info', (request, response) => {
//     response.send(`
//     <p>
//         Phonebook has info for <b>${data.length}</b> people.
//         <br><br/>
//         ${Date()}
//     <p>`)
// })
// app.get('/api/persons/:id', (request, response) => {
//     const id = Number(request.params.id)
//     const person = data.find(p => p.id === id)
//     if (person) {
//         response.json(person)
//     } else {
//     response.status(404).end()
//     }
// })

// const generateId = () => {
//     // const maxId = notes.length > 0
//     //   ? Math.max(...notes.map(n => n.id))
//     //   : 0
//     // return maxId + 1
//     return Math.floor(Math.random() * (1000 - 1 + 1) + 1)
// }

// app.post('/api/persons', (request, response) => {
//     const body = request.body
  
//     if (!body.name) {
//       return response.status(400).json({ 
//         error: 'name missing' 
//       })
//     }
//     if (!body.number) {
//         return response.status(400).json({ 
//           error: 'number missing' 
//         })
//     }
//     if (data.some(p => p.name === body.name)) {
//         return response.status(400).json({ 
//             error: 'name must be unique' 
//         })
//     }
  
//     const person = {
//         id: generateId(),
//         name: body.name,
//         number: body.number,
//     }
  
//     data = data.concat(person)
  
//     response.json(person)
// })

// app.delete('/api/persons/:id', (request, response) => {
//     const id = Number(request.params.id)
//     data = data.filter(note => note.id !== id)
  
//     response.status(204).end()
// })

// const unknownEndpoint = (request, response) => {
//     response.status(404).send({ error: 'unknown endpoint' })
// }
// app.use(unknownEndpoint)
//#endregion

app.get('/api/persons', (req, res) => {
    Person.find({}).then(n => {
      res.json(n)
    })
})
app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id)
    .then(p => {
        if (p) {
          res.json(p)
        } else {
          res.status(404).end()
    }})
    .catch(err => next(err))
})

app.post('/api/persons', (req, res, next) => {
    const body = req.body

    const person = new Person({
        name: body.name,
        number: body.number,
    })
    person.save()
    .then(saved => {
      res.json(saved)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndDelete(req.params.id)
      .then(result => {
        res.status(204).end()
      })
      .catch(err => next(err))
})

app.put('/api/persons/:id', (req, response, next) => {
    const { name, number } = req.body
    
    Person.findByIdAndUpdate(
        req.params.id, 
        { name, number }, 
        { new: true, runValidators: true, context: 'query' }
        )
        .then(updated => {
            response.json(updated)
        })
        .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
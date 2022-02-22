import 'reflect-metadata'
// eslint-disable-next-line no-unused-vars
import express, { Request, Response, NextFunction } from 'express'

import 'express-async-errors'

import cors from 'cors'

import AppError from './error/AppError'

import '@controllers/UsersController'

const app = express()
app.use(cors())
app.use(express.json())

// PASSO 1 => TEMOS 2 EMPRESAS CADASTRADAS NA NOSSA PLATAFORMA,
// GERAMOS UM TOKEN RANDOMICO PARA ELAS, E ESTE SERA O ACESSO PARA O
// PLUGIN DE FEEDBACK.

const companies = [
  {
    id: 1,
    name: 'Fluido web',
    token: 'x8c5j5MAUeA4AT42HypJtETWilEcMtQAss5R',
    feedbacks: []
  },
  {
    id: 2,
    name: 'Cade meu feedback',
    token: 'x8c5j5MAUeA4AT42HypJtETWilEcMtQAss100',
    feedbacks: []
  }
]

const isAuthenticated = (request: Request, response: Response, next: NextFunction) => {
  const token = request.headers.authorization.replace('Bearer ', '')
  const company = companies.find(company => company.token === token)

  if (!company) {
    throw new AppError('Empresa nao registrada em nossa base de dados')
  }

  next()
}

app.post('/', isAuthenticated, (request: Request, response: Response) => {
  const { api_key } = request.body

  try {
    const company = companies.find(company => company.token === api_key)

    if (!company) {
      throw new AppError('Empresa nao registrada em nossa base de dados')
    }

    return response.status(200).json(company)
  } catch (error) {
    return response.status(403).json(error)
  }
})

app.post('/feedback', isAuthenticated, (request: Request, response: Response) => {
  const { role_title, answers, message, company } = request.body

  try {
    const findCompany = companies.find(found => found.token === company.token)

    findCompany.feedbacks.push({ role_title, answers, message })

    return response.status(200).json(findCompany)
  } catch (error) {
    return response.status(403).json(error)
  }
})

app.get('/', (request: Request, response: Response) => {
  return response.status(200).json(companies)
})

app.use((err: Error, request: Request, response: Response, _: NextFunction) => {
  if (err instanceof AppError) {
    return response.status(err.statusCode).json({
      status: 'error',
      message: err.message
    })
  }

  return response.status(500).json({
    status: 'error',
    message: 'Internal server error'
  })
})

app.listen(process.env.PORT, () => {
  console.log('⚡️ server is running')
})

import request from 'supertest'

import { startServer, closeServer, server } from 'helpers/server'

describe('/Health-check', () => {
  beforeAll(startServer)

  it('should return status code 204', async () => {
    await request(server).get('/health-check').expect(200)
  })

  afterAll(closeServer)
})

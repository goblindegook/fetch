import * as nock from 'nock'
import { ffetch } from '.'
import { left, right } from 'fp-ts/lib/Either'

const URL = 'http://localhost/test'

beforeEach(nock.cleanAll)

test('handling successful JSON responses', async () => {
  const body = { foo: 'bar' }
  nock(URL)
    .get('')
    .reply(200, body, {
      'content-type': 'application/json; charset=utf-8'
    })
  const actual = await ffetch(URL).run()
  expect(actual).toEqual(right(body))
})

test('handling successful plain text responses', async () => {
  const body = '<null>'
  nock(URL)
    .get('')
    .reply(200, body, {
      'content-type': 'text/plain'
    })
  const actual = await ffetch(URL).run()
  expect(actual).toEqual(right(body))
})

test('handling connection errors', async () => {
  const message = 'message'
  nock(URL)
    .get('')
    .replyWithError(message)
  const actual = await ffetch(URL).run()
  expect(actual).toEqual(
    left({
      type: 'ConnectionError',
      message: expect.stringContaining(message)
    })
  )
})

test('handling status code errors', async () => {
  const status = 500
  const body = { foo: 'bar' }
  nock(URL)
    .get('')
    .reply(status, body, {
      'content-type': 'application/json'
    })
  const actual = await ffetch(URL).run()
  expect(actual).toEqual(
    left({
      type: 'StatusError',
      message: 'Internal Server Error',
      status,
      body
    })
  )
})

test('handling an invalid response body', async () => {
  const body = '<not ok>'
  nock(URL)
    .get('')
    .reply(200, body, {
      'content-type': 'application/json'
    })
  const actual = await ffetch(URL).run()
  expect(actual).toEqual(
    left({
      type: 'ParserError',
      message: expect.stringContaining('invalid json response body')
    })
  )
})

test('handling a plain text body for status errors', async () => {
  const status = 404
  const body = '<ok>'
  nock(URL)
    .get('')
    .reply(status, body, {
      'content-type': 'text/plain'
    })
  const actual = await ffetch(URL).run()
  expect(actual).toEqual(
    left({
      type: 'StatusError',
      message: 'Not Found',
      status,
      body
    })
  )
})

test('handling an invalid JSON body for status errors', async () => {
  const status = 400
  const body = '<not ok>'
  nock(URL)
    .get('')
    .reply(status, body, {
      'content-type': 'application/json'
    })
  const actual = await ffetch(URL).run()
  expect(actual).toEqual(
    left({
      type: 'StatusError',
      message: 'Bad Request',
      status,
      body
    })
  )
})

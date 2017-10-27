const assert = require('assert')
const request = require('supertest')
const express = require('express')
const remoteIp = require('../index')

const app = express()

app.get('/', remoteIp({isPrivateIpName: 'isPrivateIp'}))
app.get('/header/none', remoteIp({trustedHeaderSequence: []}))
app.get('/header/x-forwarded-for', remoteIp())
app.get('/header/x-real-ip', remoteIp({trustedHeaderSequence: ['X-Real-IP', 'X-Forwarded-For']}))

app.use(function (req, res) {
  let ret = {
    remoteIp: req.remoteIp,
    isPrivate: req.isPrivateIp
  }
  res.json(ret)
})

const publicIp = '8.8.8.8'
const privateIp = '10.0.0.1'
const xForwardedFor = `${publicIp}, ${privateIp}`
const xRealIp = '4.4.4.4'

describe('Public IP', function () {
  it(publicIp, function (done) {
    request(app)
      .get('/')
      .set('x-forwarded-for', publicIp)
      .expect(200, { remoteIp: publicIp, isPrivate: false }, done)
  })
})

describe('Private IP', function () {
  it(privateIp, function (done) {
    request(app)
      .get('/')
      .set('x-forwarded-for', privateIp)
      .expect(200, { remoteIp: privateIp, isPrivate: true }, done)
  })
})

describe('LoopBack', function () {
  it('LoopBack', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .then(res => {
        assert(res.body.isPrivate === true)
        done()
      })
  })
})

describe('Multi proxy', function () {
  it(xForwardedFor, function (done) {
    request(app)
      .get('/')
      .set('x-forwarded-for', xForwardedFor)
      .expect(200, { remoteIp: publicIp, isPrivate: false }, done)
  })
})

describe('Specify Trusted Header', function () {
  it('not trust header', function (done) {
    request(app)
      .get('/header/none')
      .set('x-real-ip', xRealIp)
      .set('x-forwarded-for', xForwardedFor)
      .expect(200, { remoteIp: '::ffff:127.0.0.1' }, done)
  })

  it('X-Forwarded-For', function (done) {
    request(app)
      .get('/header/x-forwarded-for')
      .set('x-real-ip', xRealIp)
      .set('x-forwarded-for', xForwardedFor)
      .expect(200, { remoteIp: publicIp }, done)
  })

  it('X-Real-IP', function (done) {
    request(app)
      .get('/header/x-real-ip')
      .set('x-real-ip', xRealIp)
      .set('x-forwarded-for', xForwardedFor)
      .expect(200, { remoteIp: xRealIp }, done)
  })
})

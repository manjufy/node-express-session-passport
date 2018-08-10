const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const jwt = require('jwt-simple')
const LocalStrategy = require('passport-local').Strategy

// for example
const USERNAME = 'manju'
const PASSWD = 'manju123'
const SECRET = 'nomnom'

const app = express()
app.use(bodyParser.json())

app.use((req, res, next) => {
    // logger setup etc
    next()
})

passport.use(new LocalStrategy((username, password, done) => {
    if (username === USERNAME && password === PASSWD) {
        done(null, jwt.encode({ username }, SECRET))
        return
    }

    done(null, false)
}))

app.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
    res.send({
        token: req.user
    })
})

app.get('/', (req, res) => res.send('Node Express Passport Session example'))

app.listen(3000, () => console.log('Listening on port 3000'))
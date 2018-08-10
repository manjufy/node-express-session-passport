const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

// for example
const USERNAME = 'manju'
const PASSWD = 'manju123'

const app = express()
app.use(bodyParser.json())

app.use((req, res, next) => {
    // logger setup etc
    next()
})

passport.use(new LocalStrategy((username, password, done) => {
    if (username === USERNAME && password === PASSWD) {
        done(null, 'TOKEN')
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

app.listen(3000, () => console.log('Listenning on port 3000'))
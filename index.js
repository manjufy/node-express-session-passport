const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const jwt = require('jwt-simple')
const LocalStrategy = require('passport-local').Strategy
const BearerStrategy = require('passport-http-bearer')
const session = require('express-session')
const uuid = require('uuid')
const FileStore = require('session-file-store')(session)
const app = express()
app.use(bodyParser.json())

// configure session middleware
/**
 * Create a session and store it in a cookie.
 * NOTE: Browsers will automatically save/send the session id and 
 * send it in each request to the server; 
 * however, cURL doesn’t automatically save our session ID
 */
app.use(session({
    name: 'manju.cookie', // optional; if not provided, cookie name would be connect.sid
    genid: (req) => {
        /**
         * If there was no session created, we come here to create a session.
         * if session is already created, we won't come here again.
         */
        console.log('Session middleware', req.sessionID)
        return uuid() // use UUID's for session id
    },
    store: new FileStore(), // creates a session folder and stores the session file in it
    secret: 'nomnomnom',
    resave: false,
    saveUninitialized: true
}))

app.use((req, res, next) => {
    // logger setup etc
    console.log('SessionID', req.sessionID)
    next()
})

// Since we don't have persistence storage yet, lets just hard code this for now
const users = [
    { id: 1234, email: 'manju@manju', password: 'abc123' }
]

const SECRET = 'nomnomnom'

// Bearer strategy to authenticate endpoints with bearer 
passport.use(new BearerStrategy((token, done) => {
    try {
        const user = users[0]
        const { email } = jwt.decode(token, SECRET)
        if (email === user.email) {
            done(null, email)
            return
        }
    } catch (error) {
        done(null, false)
    }
}));

passport.use(new LocalStrategy(
    { usernameField: 'email' },
    (email, password, done) => {
        console.log('Inside local strategy callback')
        // here we can make a call to DB to find the user based on username, password.
        // for now, lets use the hardcode ones
        const user = users[0]

    if (email === user.email && password === user.password) {
        done(null, jwt.encode({ email }, SECRET))
        return
    }

    done(null, false)
}))

// tell passport how to serialise the user
passport.serializeUser((user, done) => {
    console.log('Inside serialise cb. User id is stored to the session file store here')
    done(null, user.id)
})

app.use(passport.initialize())
app.use(passport.session())

app.get('/todos', passport.authenticate('bearer', { session: false }), (_, res) => {
    res.json([
        {
            id: 1,
            todo: 'Test'
        },
        {
            id: 2,
            todo: 'Test'
        }
    ])
})

app.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
    console.log('User', req.user)
    res.send({
        token: req.user
    })
})

app.get('/', (req, res) => res.send('Node Express Passport Session example'))

app.listen(3000, () => console.log('Listening on port 3000'))
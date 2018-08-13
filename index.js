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
    { id: 1234, email: 'manju@manju.com', password: 'abc123' }
]

const SECRET = 'nomnomnom'

// Bearer strategy to authenticate endpoints with bearer 
passport.use(new BearerStrategy((token, done) => {
    console.log('Token', token)
    try {
        const { user } = jwt.decode(token, SECRET)
        console.log('Bearer Strategy ', user)
        if (users[0].email === user.email) {
            return done(null, user)
        }
    } catch (error) {
        done(null, false)
    }
}));

passport.use(new LocalStrategy(
    { usernameField: 'email' }, // passport uses username and password authenticate user, however our app uses email, we alias it here
    (email, password, done) => {
        console.log('Inside local strategy callback')
        // here we can make a call to DB to find the user based on username, password.
        // for now, lets use the hardcode ones
        const user = users[0]

    if (email === user.email && password === user.password) {
        // return done(null, jwt.encode({ user }, SECRET))
        return done(null, user)
    }

    done(null, false)
}))

/**
 * tell passport how to serialise the user
 * Serialises user into session and determines which data of the user object should be stored in session.
 */
passport.serializeUser((user, done) => {
    console.log('Inside serialise cb. User id is stored to the session file store here')
    done(null, user.id) // store the user.id into session
})

passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)
    const user = users[0].id === id ? users[0] : false; 
    done(null, user);
})

// tell application to use passport as middleware
// configure these only after express-session and session-file-store
app.use(passport.initialize())
app.use(passport.session())

/**
 * passport.authenticate automatically invokes, req.login method http://www.passportjs.org/docs/login/
 */
app.post('/login', passport.authenticate('local'), (req, res) => {
    const user = req.user
    const token = jwt.encode({ user }, SECRET)
    console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`)
    console.log(`req.user: ${JSON.stringify(req.user)}`)
    res.send({
        token: token,
        message: "successfully logged in"
    })
})

// authorised endpiont. Must be logged into access this endpoint
app.get('/authrequired', (req, res) => {
    if(req.isAuthenticated()) {
      res.send('you hit the authentication endpoint\n')
    } else {
      res.redirect('/')
    }
})

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

app.get('/', (req, res) => res.send('Node Express Passport Session example'))

app.listen(3000, () => console.log('Listening on port 3000'))
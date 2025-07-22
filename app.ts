import express from 'express'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import router from './src/routes/index.ts';
import cors from 'cors';
import session from 'express-session';


declare module 'express-session' {
  interface SessionData {
    user: string; 
  }
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var app = express();


app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET! ,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 30 // 30min
  }
}));
app.use(express.static ('public'));
app.get('/payment', (req,res) => {
  res.sendFile(path.join(__dirname, '../public', 'payments.html'));
});
app.get('/login', (req,res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});
// Explicitly serve index.html for the root route '/'

app.use('/api',router)

export default app

import { Request, Response } from 'express';

const USER = {
  username: process.env.USER_NAME,
  password: process.env.USER_PASSWORD
};

export const login = (req: Request, res: Response) => {
  const username = String(req.body.username) 
  const password = String(req.body.password)

  // console.log("USERNAME",username,password,USER)

  if (username === USER.username && password === USER.password) {
    req.session.user =username ;
    // console.log(req.session)
    res.status(200).json({ message: 'Login successful' });
    return
  }

   res.status(401).json({ error: 'Invalid username or password' });
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
       res.status(500).json({ error: 'Logout failed' });
       return;
    }
    res.clearCookie('connect.sid');
     res.status(200).json({ message: 'Logged out successfully' });
  });
};

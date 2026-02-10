import type { Request, Response, NextFunction } from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (!username || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if(!email || !password) {
      res.status(400).json({ message: "Email and password required"});
      return;
    }

    const result = await pool.query(
      'SELECT id, username, email, password FROM users WHERE email = $1',
      [email]
    );

    if(result.rows.length === 0) {
      res.status(401).json({ message: "Invalid email or password"});
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch) {
      res.status(401).json({ message: "Invalid email or password"});
      return;
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: "Login succesful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
}

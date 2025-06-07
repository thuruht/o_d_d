import { Hono } from 'hono';
import { Env } from '../types';
import { authRouter } from './auth';
import { locationsRouter } from './locations';
import { submissionsRouter } from './submissions';
import { votingRouter } from './voting';
import { adminRouter } from './admin';
import { mediaRouter } from './media';
import { reportsRouter } from './reports';
import { favoritesRouter } from './favorites';
import { usersRouter } from './users';

export const apiRouter = new Hono<{ Bindings: Env }>()
  .route('/auth', authRouter)
  .route('/users', usersRouter)
  .route('/locations', locationsRouter)
  .route('/submissions', submissionsRouter)
  .route('/votes', votingRouter)
  .route('/admin', adminRouter)
  .route('/media', mediaRouter)
  .route('/reports', reportsRouter)
  .route('/favorites', favoritesRouter);
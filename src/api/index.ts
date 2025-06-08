import express from 'express';
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

const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/locations', locationsRouter);
apiRouter.use('/submissions', submissionsRouter);
apiRouter.use('/votes', votingRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/favorites', favoritesRouter);

export default apiRouter;
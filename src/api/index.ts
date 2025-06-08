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

const apiRouter = new Hono();

apiRouter.route('/auth', authRouter);
apiRouter.route('/users', usersRouter);
apiRouter.route('/locations', locationsRouter);
apiRouter.route('/submissions', submissionsRouter);
apiRouter.route('/votes', votingRouter);
apiRouter.route('/admin', adminRouter);
apiRouter.route('/media', mediaRouter);
apiRouter.route('/reports', reportsRouter);
apiRouter.route('/favorites', favoritesRouter);

export default apiRouter;
// If this file exists and exports anything, it might conflict
// Either remove this file entirely, or make sure it doesn't export anything that conflicts
// with individual API modules

// If you want to keep this file, it should only re-export the routers:
export { default as authRouter } from './auth';
export { default as locationsRouter } from './locations';
export { default as mediaRouter } from './media';
export { default as usersRouter } from './users';
export { default as adminRouter } from './admin';
export { default as reportsRouter } from './reports';
export { default as submissionsRouter } from './submissions';
export { default as votingRouter } from './voting';
export { default as favoritesRouter } from './favorites';
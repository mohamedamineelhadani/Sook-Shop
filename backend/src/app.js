import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import routes from './routes/index.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin: [config.clientUrl, config.adminUrl],
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;

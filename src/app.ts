/* eslint-disable import/order */
/* eslint-disable class-methods-use-this */
import config, { isDev } from './utils/configUtils';
import logger from './utils/logger';
import { requestContextBinder } from './utils/requestContext';

import auth from './security/auth';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import https from 'https';

import morgan from 'morgan';
import path from 'path';

import { ServerResponse } from 'http';
import IController from './controllers/IController';

class App {
    public app: express.Application;

    private readonly path: string = '/api';

    constructor(controllers: IController[]) {
      this.app = express();

      this.initializeMiddlewares();
      this.initializeControllers(controllers);
      this.initializeErrorHandlers();
    }

    public listen() {
      if (config.get('ssl') === true) {
        const certPaths = {
          key: config.get<string>('privateKey'),
          cert: config.get<string>('certificate'),
          ca: config.get<string>('ca'),
        };

        // Function to load certificates from disk
        const loadCertificates = () => ({
          key: fs.readFileSync(certPaths.key, 'utf8'),
          cert: fs.readFileSync(certPaths.cert, 'utf8'),
          ca: fs.readFileSync(certPaths.ca, 'utf8'),
        });

        const httpsServer = https.createServer(loadCertificates(), this.app);

        // Function to reload certificates into the running server
        const reloadCertificates = () => {
          try {
            const newCerts = loadCertificates();
            httpsServer.setSecureContext(newCerts);
            logger.info('SSL certificates reloaded successfully');
          } catch (error) {
            logger.error('Failed to reload SSL certificates:', error);
          }
        };

        // Watch the certificate directory for changes
        // Let's Encrypt renews certificates and updates the symlinks
        const certDir = path.dirname(certPaths.cert);
        let reloadTimeout: ReturnType<typeof setTimeout> | null = null;

        fs.watch(certDir, (eventType, filename) => {
          if (filename) {
            logger.info(`Certificate file changed: ${filename}, scheduling reload...`);

            // Debounce: wait 5 seconds to ensure all files are written
            // and avoid multiple reloads for multiple file changes
            if (reloadTimeout) {
              clearTimeout(reloadTimeout);
            }
            reloadTimeout = setTimeout(() => {
              reloadCertificates();
              reloadTimeout = null;
            }, 5000);
          }
        });

        httpsServer.listen(config.get('port'), () => {
          logger.info(`Server running in https and listening on port ${config.get('port')}`);
          logger.info(`Watching for certificate changes in: ${certDir}`);
        });
      } else {
        this.app.listen(config.get('port'), () => {
          logger.info(`Server running and listening on port ${config.get('port')}`);
        });
      }
    }

    private initializeMiddlewares() {
      this.app.use(cors());
      if (isDev) {
        this.app.use(morgan('dev'));
      }

      this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
      this.app.use(bodyParser.json({ limit: '50mb' }));
      this.app.use(express.static(path.join(__dirname, 'public')));

      this.app.use('/api/uploads', express.static(config.get('ImageFolder')));

      this.app.use(auth.optional, requestContextBinder());
    }

    private initializeControllers(controllers: IController[]) {
      controllers.forEach((controller) => {
        this.app.use(this.path, controller.getRouter());
      });
    }

    private initializeErrorHandlers() {
      this.app.use(this.logErrors);
      this.app.use(this.clientErrorHandler);
      this.app.use(this.errorHandler);
    }

    private logErrors(err: any, _req: express.Request, _res: express.Response, next: any) {
      logger.error(err);
      next(err);
    }

    private clientErrorHandler(err, req, res, next) {
      if (req.xhr) {
        res.status(500).send({ error: 'Something failed!' });
      } else {
        next(err);
      }
    }

    // eslint-disable-next-line no-unused-vars
    private errorHandler(err: any, _req: express.Request, res: express.Response, _next: any) {
      if (!(err instanceof ServerResponse)) {
        res.status(err.status || 500).json({
          errors: {
            error: err,
            message: err.message,
          },
        });
      }
    }
}

export default App;

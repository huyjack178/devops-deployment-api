const fastify = require('fastify');
const multer = require('fastify-multer');
const configs = require('./configs');
const server = fastify();
const Sentry = require('@sentry/node');
const controllers = require('./controllers');

Sentry.init({
  dsn: configs.sentryDsn,
  tracesSampleRate: 1.0,
});

server.register(multer.contentParser).register(require('fastify-cors'), {
  origin: '*',
});

controllers.home(server);
controllers.auth(server);
controllers.command(server);
controllers.scp(server);

server.listen('22222', '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  Sentry.captureMessage(`Server listening at ${address}`, 'info');
  console.log(`Server listening at ${address}`);
});

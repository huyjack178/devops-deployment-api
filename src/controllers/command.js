const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');
const multer = require('fastify-multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Sentry = require('@sentry/node');

module.exports = (server) => {
  server.post('/command', { preHandler: upload.single('file') }, (req, res) => {
    ssh
      .connect({
        host: req.body.host,
        port: req.body.port ?? 22,
        username: req.body.user ?? 'root',
        privateKey: path.join(__dirname, '../id_rsa'),
      })
      .then(() => {
        ssh
          .execCommand(req.body.command)
          .then((result) => {
            if (result.stderr) {
              Sentry.captureMessage(`**[${req.body.env}|${req.body.jobid}]** ${result.stderr}`, 'error');
              res.status(500).send(result.stderr);
            } else {
              res.status(200).send(result.stdout);
            }
          })
          .catch((error) => {
            Sentry.captureMessage(`**[${req.body.env}|${req.body.jobid}]** ${error}`, 'error');
            res.status(500).send(error);
          });
      })
      .catch((error) => {
        Sentry.captureMessage(`**[${req.body.env}|${req.body.jobid}]** ${error}`, 'error');
        res.status(500).send(error);
      });
  });
};

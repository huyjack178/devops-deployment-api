const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();
const path = require('path');
const multer = require('fastify-multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = (server) => {
  server.post('/scp', { preHandler: upload.single('file') }, async (req, res) => {
    const file = req.file;
    const fileName = file.originalname;
    const folderPath = mkDirByPathSync('./temp/' + Math.floor(new Date().getTime() / 1000), true);
    fs.writeFileSync(`${folderPath}/${fileName}`, file.buffer);

    ssh
      .connect({
        host: req.body.host,
        port: req.body.port ?? 22,
        username: req.body.user ?? root,
        privateKey: path.join(__dirname, '../id_rsa'),
      })
      .then(() => {
        ssh
          .putFile(`${folderPath}/${fileName}`, `${req.body.remotePath}`)
          .then(() => {
            fs.rmdirSync(folderPath, { recursive: true });
            res.status(200).send('success');
          })
          .catch((error) => {
            Sentry.captureException(`JOB ID: ${req.body.jobid}\n COMMIT: ${req.body.commit}\n ERROR: ${error}`);
            res.status(500).send(error);
          });
      })
      .catch((error) => {
        Sentry.captureException(`JOB ID: ${req.body.jobid}\n COMMIT: ${req.body.commit}\n ERROR: ${error}`);
        res.status(500).send(error);
      });
  });

  const mkDirByPathSync = (targetDir, { isRelativeToScript = false } = {}) => {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(baseDir, parentDir, childDir);
      try {
        fs.mkdirSync(curDir, { recursive: true });
      } catch (err) {
        if (err.code === 'EEXIST') {
          return curDir;
        }

        // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
        if (err.code === 'ENOENT') {
          // Throw the original parentDir error on curDir `ENOENT` failure.
          throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
        }

        const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
        if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
          throw err; // Throw if it's just the last created dir.
        }
      }

      return curDir;
    }, initDir);
  };
};

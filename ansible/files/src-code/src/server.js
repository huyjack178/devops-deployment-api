const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();
const fastify = require('fastify');
const path = require('path');
const multer = require('fastify-multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const port = 22222;
const server = fastify();

server.register(multer.contentParser).register(require('fastify-cors'), {
  origin: '*',
});

server.get('/', (req, res) => {
  res.send('Deployment API is running!');
});

server.post('/command', { preHandler: upload.single('file') }, (req, res) => {
  ssh
    .connect({
      host: req.body.host,
      port: req.body.port ?? 22,
      username: req.body.user ?? 'root',
      privateKey: path.join(__dirname, 'id_rsa'),
    })
    .then(() => {
      ssh
        .execCommand(req.body.command)
        .then((result) => {
          if (result.stderr) {
            res.status(500).send(result.stderr);
          } else {
            res.status(200).send(result.stdout);
          }
        })
        .catch((error) => res.status(500).send(error));
    })
    .catch((error) => res.status(500).send(error));
});

server.post('/scp', { preHandler: upload.single('file') }, async (req, res) => {
  console.log(req.file);
  const file = req.file;
  const fileName = file.originalname;
  const folderPath = mkDirByPathSync('./temp/' + Math.floor(new Date().getTime() / 1000), true);
  fs.writeFileSync(`${folderPath}/${fileName}`, file.buffer);

  ssh
    .connect({
      host: req.body.host,
      port: req.body.port ?? 22,
      username: req.body.user ?? root,
      privateKey: path.join(__dirname, 'id_rsa'),
    })
    .then(() => {
      ssh
        .putFile(`${folderPath}/${fileName}`, `${req.body.remotePath}`)
        .then(() => {
          fs.rmdirSync(folderPath, { recursive: true });
          res.status(200).send('success');
        })
        .catch((error) => res.status(500).send(error));
    })
    .catch((error) => res.status(500).send(error));
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

server.listen(port, '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});

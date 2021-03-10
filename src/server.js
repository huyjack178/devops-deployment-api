const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const express = require('express');
const app = express();
const port = 22222;

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Deployment API is running!');
});

app.post('/ssh', (req, res) => {
  console.log(req.body);

  ssh
    .connect({
      host: req.body.host,
      port: req.body.port ?? 22,
      username: req.body.user ?? root,
      privateKey: './id_rsa',
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
        .catch((error) => console.log(error));
    })
    .catch((error) => console.log(error));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`app listening at http://0.0.0.0:${port}`);
});

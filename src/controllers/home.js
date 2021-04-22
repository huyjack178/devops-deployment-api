module.exports = (server) => {
  server.get('/', (req, res) => {
    res.send('Deployment API is running!');
  });
};

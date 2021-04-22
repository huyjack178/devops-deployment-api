const authToken = '64E97A7A53B4E48B6631DFF184CC6';

module.exports = (server) => {
  server.addHook('onRequest', (request, reply, done) => {
    const token = request.query.token;

    if (token != authToken && request.method == 'POST') {
      reply.status(401).send();
    }

    done();
  });
};

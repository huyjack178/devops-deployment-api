const command = require('./command');
const scp = require('./scp');
const auth = require('./auth');
const home = require('./home');

module.exports = {
  home,
  auth,
  command,
  scp,
};

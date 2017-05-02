var express = require('express');
var compression = require('compression');

const build = `${__dirname}/build`;
const port = process.env.PORT || 3000;

const app = express();

app.use(compression());
app.use(express.static(build));

app.get('/prototype-demo', function(req, res) {
  res.redirect(302, 'https://www.youtube.com/watch?v=PeUP6_r38oA')
});

app.listen(port, function (error) {
  if (error) {
    console.error(error);
  }

  console.info('Server is now running. Express is listening on port %s', port);
});

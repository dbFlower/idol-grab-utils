const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const { token, pocket48 } = require('./config')

const isProd = app.get('env') === 'production'

const resolve = file => path.resolve(__dirname, file)

const serve = (path, cache) => express.static(resolve(path), { // eslint-disable-line
  maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0
})

app.set('trust proxy', 'loopback')

if (isProd) {
  app.use(logger('combined'));
} else {
  app.use(logger('dev'));
}

if (!pocket48.account || !pocket48.password) {
  console.log('[Warning]: 口袋48账号密码未设置！口袋房间消息将无法获取。')
}

app.use('*', function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache')

  if (!token) return next()

  let userToken = ''

  if (req.get('token')) {
    userToken = req.get('token')
  } else if (req.body && req.body.token) {
    userToken = req.body.token
    Reflect.deleteProperty(req.body, 'token')
  } else if (req.query.token) {
    userToken = req.query.token
    Reflect.deleteProperty(req.query, 'token')
  }

  if (userToken.toLowerCase() === token.toLowerCase()) return next()

  res.json({
    status: 403,
    _code: 403,
    message: 'token required',
  })
})

app.use(cookieParser());


// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('helmet')())
app.use('/', require('./routes'))


// catch 404 and forward to error handler
app.use(function(req, res) {
  res.status(404).json({
    message: 'not found'
  })
});

// error handler
if (!isProd){
  app.use(function (err, req, res) {
    // console.error(err);

    const status = err.status || (err.response && err.response.status)
    console.log('status', status)

    if (res.headersSent) return;
    res.status(status || 500).json({
      message: err.message,
      err,
    })
  })
} else {
  app.use(function(err, req, res) {
    // console.error(err);
    const status = err.status || (err.response && err.response.status)

    console.log('status', status)
    if (res.headersSent) return;

    res.status(status || 500).json({
      message: err.message,
    })
  });
}

module.exports = app;

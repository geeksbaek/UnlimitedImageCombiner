
/*
 * GET home page.
 */

var fs = require('fs');

exports.index = function(req, res){
  // res.render('index', { title: 'Express' });
  res.sendfile('public/index.html');
};
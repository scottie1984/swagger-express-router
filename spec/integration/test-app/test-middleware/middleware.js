'use strict';

const swagTest = (req, res) => res.send('Blah1');
const swagTestPost = (req, res) => res.send('Blah1');
const swagTestName = (req, res) => {
  const name = req.params.name;
  res.send('Blah1 ' + name);
};

module.exports = {
  swagTest,
  swagTestPost,
  swagTestName
};
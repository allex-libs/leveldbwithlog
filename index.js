function initLib (execlib) {
  return execlib.loadDependencies('client', ['allex_leveldblib'], require('./creator').bind(null, execlib));
}

module.exports = initLib;

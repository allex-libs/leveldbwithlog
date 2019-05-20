var lR = ALLEX.execSuite.libRegistry;

lR.register('allex_leveldbwithloglib',
  require('./creator')(
    ALLEX,
    lR.get('allex_leveldblib')
  )
);

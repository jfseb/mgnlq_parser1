var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
// var Parser = require(root + '/index.js')

var SentenceParser = require(root + '/sentenceparser.js');

var Ast = require(root + '/ast.js');

var debuglog = require('debug')('sentenceparser.nunit');

var mgnlq_er = require('mgnlq_er');

var Sentence = mgnlq_er.Sentence;

var Erbase = mgnlq_er.ErBase;



process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});


// const utils = require('abot_utils')

// const inputFiterRules = require(root + '/match/inputFilterRules.js')

// const InputFilter = mgnlq_er.InputFilter

const Model = require('mgnlq_model').Model;


var getModel = require('mgnlq_testmodel_replay').getTestModel;


var words = {};

exports.testTokenizeStringOrbitWhatis = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
  test.expect(1);
  getModel().then((theModel) => {
    var res = Erbase.processString('orbit of the earth', theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'of', 'the', 'FACT']);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeNumber = function (test) {
  test.expect(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'sender with more than 1234 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'with', 'more than', '12', 'CAT']);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeNumberOrElement = function (test) {
  test.expect(3);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'sender with more than 12 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    test.deepEqual( 2, res.sentences.length );
    {
      var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
      var sStrings = lexingResult.map(t => t.image);
      debuglog(sStrings.join('\n'));
      test.deepEqual(sStrings, ['CAT',  'with', 'more than', '12', 'CAT']);
    }
    {
      lexingResult = SentenceParser.getLexer().tokenize(res.sentences[1]);
      sStrings = lexingResult.map(t => t.image);
      debuglog(sStrings.join('\n'));
      test.deepEqual(sStrings, ['FACT', 'with', 'more than', '12', 'FACT']);
    }
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testTokenizeCatCatCat = function (test) {
  test.expect(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicationComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT']);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeCatCatCatParse = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
  test.expect(2);
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    //console.log('here the ouptut ' + JSON.stringify(Ast.dumpNodeNice(parsingResult),undefined,2));
    test.deepEqual(Ast.dumpNodeNice(parsingResult),
      {
        'type': 'BINOP',
        'index': -1,
        'children': [
          {
            'type': 'OPAll',
            'index': -1,
            'children': [
              {
                'type': 'LIST',
                'index': -1,
                'children': [
                  {
                    'type': 'CAT',
                    'index': 0
                  },
                  {
                    'type': 'CAT',
                    'index': 1
                  },
                  {
                    'type': 'CAT',
                    'index': 2
                  },
                  {
                    'type': 'CAT',
                    'index': 3
                  }
                ]
              }
            ]
          },
          {
            'type': 'LIST',
            'index': -1,
            'children': [
              {
                'type': 'OPEqIn',
                'index': -1,
                'children': [
                  {
                    'type': 'CAT',
                    'index': 5
                  },
                  {
                    'type': 'FACT',
                    'index': 6
                  }
                ]
              },
              {
                'type': 'OPEqIn',
                'index': -1,
                'children': [
                  {
                    'type': 'CAT',
                    'index': 7
                  },
                  {
                    'type': 'FACT',
                    'index': 8
                  }
                ]
              },
              {
                'type': 'OPEqIn',
                'index': -1,
                'children': [
                  {
                    'type': 'CATPH',
                    'index': -1
                  },
                  {
                    'type': 'FACT',
                    'index': 9
                  }
                ]
              }
            ]
          }
        ]
      }
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeCatCatCatParseText = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
  test.expect(3);
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    test.equal(res.sentences.length, 1);
    //console.log(JSON.stringify(res.sentences,undefined,2));
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));
    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeDomain = function (test) {
  test.expect(1);
  getModel().then((theModel) => {
    var s = 'domain FioriBOM';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['domain', 'DOM']);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseInDomain = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction in domain FioriBOM';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'in', 'domain', 'DOM']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    // console.log('\n' + Ast.astToText(parsingResult));
    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(3)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  undefined\n  DOM 4\n');
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testParseEndingWith = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'SemanticObject ending with element';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'ending with', 'ANY']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    // console.log('\n' + Ast.astToText(parsingResult));
    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEndsWith 1(2)\n      CAT 0\n      ANY 2\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseSimpleEndingWith = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'domains ending with ABC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'ending with', 'ANY']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));
    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEndsWith 1(2)\n      CAT 0\n      ANY 2\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseWithEndingWith = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'element names, atomic weights with element name ending with ABC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'CAT', 'with', 'CAT', 'ending with', 'ANY' ]);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(1)\n    OPEndsWith 4(2)\n      CAT 3\n      ANY 5\n'
      , 'proper ast' );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseWithEndingWithOne = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'element name ending with ABC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'ending with', 'ANY' ]);
    var parsingResult = SentenceParser.parse(lexingResult.slice(1), 'opFactAny');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'OPEndsWith 1(2)\n  undefined\n  ANY 2\n'
      , 'proper ast' );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testParseMoreThanS = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'more than 1234 sender';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'more than', '12', 'CAT' ]);
    var parsingResult = SentenceParser.parse(lexingResult.slice(0), 'MoreThanLessThanExactly');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'OPMoreThan 0(2)\n  NUMBER 1\n  CAT 2\n'
      , 'proper ast' );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseMoreThanXXOK = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'sender with less than 3 standort BFBS';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    console.log( sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'with', 'less than', '12', 'CAT', 'FACT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPLessThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseMoreThanXX = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'sender with more than 3 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    console.log( sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'with', 'more than', '12', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseMoreThanXX1 = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'sender with more than 3 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    console.log( sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'with', 'more than', '12', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n' );
    test.done();
    Model.releaseModel(theModel);
  });
};


// TODO SAME WITH AND!
exports.testParseMoreThanMT_MT = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'sender with more than 3 standort , less than 2 sender';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    console.log( sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'with', 'more than', '12', 'CAT',
      'less than' ,
      '12', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPLessThan 5(2)\n      NUMBER 6\n      CAT 7\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseMoreThan_MT = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'sender with more than 3 standort';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    console.log( sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'with', 'more than', '12', 'CAT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n');
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseMoreThan_MT_F = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'sender with more than 3 standort, bfbs';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    console.log( sStrings.join('\n'));
    test.deepEqual(sStrings,  [ 'CAT', 'with', 'more than', '12', 'CAT', 'FACT']);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
    // /test.deepEqual(parsingResult, {})
    debuglog('\n' + Ast.astToText(parsingResult));

    test.deepEqual(Ast.astToText(parsingResult),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPMoreThan 2(2)\n      NUMBER 3\n      CAT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testcategoriesStartingWith = function (test) {
  test.expect(8);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'categories starting with "elem" in domain IUPAC';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    //  test.deepEqual(Ast.astToText(parsingResult),
    //  'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEndsWith 1(2)\n      CAT 0\n      ANY 2\n'
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    test.deepEqual(r.sentences.length, 6, 'sentence length');
    test.deepEqual(r.asts.length, 6, 'asts length');
    test.deepEqual(r.errors.length, 6, 'error');
    test.deepEqual(r.asts.map((r, index) => (r) ? index : undefined).filter(a => a !== undefined).join('-'), '0-2', 'asts');
    test.deepEqual(r.errors.map((r, index) => (r) ? index : undefined).filter(a => a !== undefined).join('-'), '1-3-4-5', 'asts');
    debuglog(r.sentences[0]);
    test.deepEqual(Sentence.simplifyStringsWithBitIndex(r.sentences[0]).join('\n'),
      'categories=>category/category C32\nstarting with=>starting with/operator/2 O512\nelem=>elem/any A4096\nin=>in/filler I512\ndomain=>domain/category C32\nIUPAC=>IUPAC/domain F32'
      , 'sentence');
    test.deepEqual(Ast.astToText(r.asts[0]),
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(2)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CAT 4\n      FACT 5\n', 'ast flat');
    test.deepEqual(Ast.astToText(r.asts[2]),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 4\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 5\n'
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPStartsWith 1(2)\n      CAT 0\n      ANY 2\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 4\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 5\n'
      , 'ast 2 flat');
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testparseSentenceToAstsCatCatCatParseText = function (test) {
  test.expect(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    test.deepEqual(Ast.astToText(r.asts[0]),
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 9\n'
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};



exports.testparseCategoriesInDomainAlias = function (test) {
  test.expect(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'categories in  Fiori BOM';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    debuglog(()=> JSON.stringify(r));

    test.deepEqual(Ast.astToText(r.asts[0]),
    //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 9\n'
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(1)\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 2\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};



exports.testparseSentenceToAstsCatAndCatForSthText = function (test) {
  test.expect(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'element symbol and atomic weight for gold';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    test.deepEqual(Ast.astToText(r.asts[0]),
      //'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1\n      FACT 9\n'

      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 2\n  LIST -1(1)\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 4\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


//"list all SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain',


exports.testparseSentenceForFact1WithCatFact = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'SemanticObject  for FI-FIO-GL with ApplicationType "FPM/WEbDynpro" Maintain';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    test.deepEqual(r.errors[0],false);
    test.deepEqual(Ast.astToText(r.asts[0]),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(1)\n      CAT 0\n  LIST -1(3)\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 2\n    OPEqIn -1(2)\n      CAT 4\n      FACT 5\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 6\n',
      'correct ast'  );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testparseSentenceStartingWith = function (test) {
  test.expect(2);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction with SemanticObject starting with Sup';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    test.deepEqual(r.errors[0],false);
    test.deepEqual(Ast.astToText(r.asts[0]),
      'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(1)\n    OPStartsWith 4(2)\n      CAT 3\n      ANY 5\n'
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testparseSentenceToAstssError = function (test) {
  test.expect(1);
  getModel().then((theModel) => {
    // debuglog(JSON.stringify(ifr, undefined, 2))
    // console.log(theModel.mRules)
    var s = 'semanticObject, SemanticAction, BSPName with UI5';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    test.deepEqual(r.errors,
      [
        {
          'err_code': 'NO_KNOWN_WORD',
          'text': 'I do not understand "UI5".',
          'context': {
            'tokens': [
              'semanticObject',
              'SemanticAction',
              'BSPName',
              'with',
              'UI5'
            ],
            'token': 'UI5',
            'index': 4
          }
        }
      ]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


/*
describe Application Component
list all AppIds for FI-FIO-GL with ApplicationType "Reuse Component"
list all Application Component, BSPName, ODataService, fiori intent for maintain
list all Application Components starting with FIN-
list all ApplicationTypes for #GLAccount-manage
List all appNames in ApplicationComponent PLM-FIO-RCP
list all BSP Urls for ui.ssuite.s2p.mm.pur.po.create.s1
list all categories
list all element names starting with ni
list all element names starting with ni in domain IUPAC
list all example commands
list all fiori intents in FIN-FIO-CCD with ApplicationType Analytical
list all hints
list all intents for FI-FIO-GL with ApplicationType "FPM/WebDynpro"
list all OData Services for retail.store.stockcorrection
List all ODataServices for FI-FIO-GL
make table with AppId, "fiori intent", ApplicationComponent, AppName, BusinessRoleName, BSPName
Show me #RequestForQuotation-manage
what are the sanitation facilities in tuvalu
what is the "ui5 component name" for fiori intent #RequestForQuotation-manage
what is the ApplicationComponent for sap.cus.sd.lib.processflow
what is the ApplicationType for #ControllingDocument-setControllingArea
What is the BSPName for Fiori App "Manage Labels"
what is the element name for element number 117
What is the TransactionCode for Fiori App "Manage Labels"
*/

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
// var Parser = require(root + '/index.js')

var SentenceParser = require(root + '/sentenceparser.js');

var FormatError = require(root + '/formaterror.js');
var Ast = require(root + '/ast.js');

var debuglog = require('debug')('sentenceparser.nunit');

var abot_erbase = require('mgnlq_er');

var Erbase = abot_erbase.ErBase;

// const utils = require('abot_utils')

// const inputFiterRules = require(root + '/match/inputFilterRules.js')

// const InputFilter = abot_erbase.InputFilter

const Model = require('mgnlq_model').Model;
var getModel = require('mgnlq_testmodel_replay').getTestModel;

var words = {};

exports.testTokenizeStringOrbitWhatis = function (test) {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
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

exports.testTokenizeCatCatCat = function (test) {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicationComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeCatCatCatParse = function (test) {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
  // /test.deepEqual(parsingResult, {})
  // console.log('here the ouptut ' + JSON.stringify(Ast.dumpNodeNice(parsingResult),undefined,2))
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
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
  // /test.deepEqual(parsingResult, {})
  // console.log('\n' + Ast.astToText(parsingResult))
    test.deepEqual(Ast.astToText(parsingResult),
    'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
  );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeCatCatCatErr = function (test) {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, ApplicationComponent starting with';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, [ 'CAT', 'CAT', 'CAT', 'starting with' ]);
    var resErr = 'abc';
    try {
      SentenceParser.parse(lexingResult, 'catListOpMore');
      test.equal(1, 0);
    } catch(e) {
      debuglog(e);
      resErr = FormatError.formatError(e.error_obj, res.sentences[0]);
    }
  // /test.deepEqual(parsingResult, {})
    debuglog('\n' + resErr.text);
    test.deepEqual(resErr.text, 'Sentence terminated unexpectedly, i expected a fact or a string fragment.');
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeInterimErr = function (test) {
  getModel().then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, CO-FIO, and ApplicationComponent with';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, [ 'CAT', 'CAT', 'FACT', 'and', 'CAT', 'with' ]);
    var resErr;
    try {
      SentenceParser.parse(lexingResult, 'catListOpMore');
    } catch(e) {
      debuglog(e);
      resErr = FormatError.formatError(e.error_obj, res.sentences[0]);
    }
  // /test.deepEqual(parsingResult, {})
    debuglog('\n' + resErr.text);
    test.deepEqual(resErr.text, 'I do not understand the fact "CO-FIO" at this position in the sentence.');
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testExtractExpect = function (test) {
  var res = FormatError.extractExpectArr(' one of these possible Token sequences:\n  1. [AFact]\n  2. [AnANY]\nbut found: \'\'');
  test.deepEqual(res, ['AFact', 'AnANY']);
  test.done();
};

exports.testAbc = function (test) {
  var error = [{
    'name': 'NotAllInputParsedException',
    'message': 'Redundant input, expecting EOF but found: FACT',
    'token': {
      'image': 'FACT',
      'startOffset': 2,
      'tokenType': 7
    },
    'resyncedTokens': [],
    'context': {
      'ruleStack': [],
      'ruleOccurrenceStack': []
    }
  }
  ];
  var sentence = [
    undefined,
    undefined,
    {
      'string': 'CO-FIO',
      'matchedString': 'CO-FIO',
      'category': 'ApplicationComponent',
      'rule': {
        'category': 'ApplicationComponent',
        'matchedString': 'CO-FIO',
        'type': 0,
        'word': 'CO-FIO',
        'bitindex': 512,
        'bitSentenceAnd': 512,
        'wordType': 'F',
        '_ranking': 0.95,
        'exactOnly': true,
        'lowercaseword': 'co-fio'
      },
      '_ranking': 0.9974999999999999,
      'reinforce': 1.05
    }
  ];

  var res = FormatError.formatError(error[0], sentence);
  test.deepEqual(res.text, 'I do not understand the fact "CO-FIO" at this position in the sentence.');
  test.done();
};

var s = `Error: NoViableAltException: Expecting: one of these possible Token sequences:
  1. [AFact]
  2. [AnANY]
`;

exports.testGetQualifierFromWordType = function (test) {
  var res = FormatError.getExpecting(s);
  test.deepEqual(res, 'a fact or a string fragment');
  test.done();
};

exports.testGetQualifierFromWordType = function (test) {
  var res = FormatError.getExpecting(s);
  test.deepEqual(res, 'a fact or a string fragment');
  test.done();
};

exports.testGetQualifierFromWordType = function (test) {
  var res = ['A', 'X', 'F', 'C', 'D', '', 'O', undefined].map(arg => FormatError.getQualifierFromWordType(arg));
  test.deepEqual(res, ['', '', 'the fact', 'the category', 'the domain', '', 'the operator', '']);
  test.done();
};


exports.testmapTokenStringToHumanString = function (test) {
  var res = ['AFact', 'AnANY', '', undefined].map(arg => FormatError.mapTokenStringToHumanString(arg));
  test.deepEqual(res, ['fact', 'string fragment', undefined, undefined]);
  test.done();
};

var aToken = {
  'string': 'CO-FIO',
  'matchedString': 'CO-FUU',
  'category': 'ApplicationComponent',
  'rule': {
    'category': 'ApplicationComponent',
    'matchedString': 'CO-BAR',
    'type': 0,
    'word': 'CO-XWORD',
    'bitindex': 512,
    'bitSentenceAnd': 512,
    'wordType': 'F',
    '_ranking': 0.95,
    'exactOnly': true,
    'lowercaseword': 'co-ffroombel'
  },
  '_ranking': 0.9974999999999999,
  'reinforce': 1.05
};

exports.testGetWordType = function (test) {
  test.expect(3);
  test.deepEqual(FormatError.getTokenQualifier({ startOffset: 0}, [aToken]), 'the fact', 'qualifier ok');
  test.deepEqual(FormatError.getSentenceToken({ startOffset: 0}, [aToken]), aToken, 'token ok');
  test.deepEqual(FormatError.getTokenText({ startOffset: 0}, [aToken]), 'CO-FIO', 'token ok');
  test.done();
};

exports.testGetWordTypeBadOffset = function (test) {
  test.expect(4);
  try {
    FormatError.getTokenQualifier({ startOffset: -1}, [aToken]);
    test.equal(1, 0);
  } catch(e) {
    test.equal(1, 1);
  }
  try {
    FormatError.getSentenceToken({ startOffset: Number.NaN}, [aToken]);
    test.equal(1, 0);
  } catch(e) {
    test.equal(1, 1);
  }
  try {
    FormatError.getSentenceToken({ startOffset: 1}, [aToken]);
    test.equal(1, 0);
  } catch(e) {
    test.equal(1, 1);
  }
  try {
    FormatError.getTokenText({ startOffset: 2}, [aToken, aToken]);
    test.equal(1, 0);
  } catch(e) {
    test.equal(1, 1);
  }
  test.done();
};

exports.testUnknownError = function (test) {
  var error = [{
    'name': 'unknowntype',
    'message': 'Redundant input, expecting EOF but found: FACT',
    'token': {
      'image': 'FACT',
      'startOffset': 2,
      'tokenType': 7
    },
    'resyncedTokens': [],
    'context': {
      'ruleStack': [],
      'ruleOccurrenceStack': []
    }
  }
  ];
  var sentence = [
    undefined,
    undefined,
    {
      'string': 'CO-FIO',
      'matchedString': 'CO-FIO',
      'category': 'ApplicationComponent',
      'rule': {
        'category': 'ApplicationComponent',
        'matchedString': 'CO-FIO',
        'type': 0,
        'word': 'CO-FIO',
        'bitindex': 512,
        'bitSentenceAnd': 512,
        'wordType': 'F',
        '_ranking': 0.95,
        'exactOnly': true,
        'lowercaseword': 'co-fio'
      },
      '_ranking': 0.9974999999999999,
      'reinforce': 1.05
    }
  ];

  var res = FormatError.formatError(error[0], sentence);
  test.deepEqual(res.text, JSON.stringify(error[0]));
  test.done();
};

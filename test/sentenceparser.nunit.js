var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
// var Parser = require(root + '/index.js')

var SentenceParser = require(root + '/sentenceparser.js');

var Ast = require(root + '/ast.js');

var debuglog = require('debug')('sentenceparser.nunit');

var mgnlq_er = require('mgnlq_er');

var Erbase = mgnlq_er.ErBase;

// const utils = require('abot_utils')

// const inputFiterRules = require(root + '/match/inputFilterRules.js')

// const InputFilter = mgnlq_er.InputFilter

const Model = require('mgnlq_model').Model;

var mongooseMock = require('mongoose_record_replay').instrumentMongoose(require('mongoose'),
  'node_modules/mgnlq_testmodel_replay/mgrecrep/',
  'REPLAY');

var words = {};

exports.testTokenizeStringOrbitWhatis = function (test) {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
  test.expect(1);
  Model.loadModels(mongooseMock).then((theModel) => {
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
  test.expect(1);
  Model.loadModels(mongooseMock).then((theModel) => {
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
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
  test.expect(2);
  Model.loadModels(mongooseMock).then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
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
  Model.loadModels(mongooseMock).then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var res = Erbase.processString(s, theModel.rules, words);
    test.equal(res.sentences.length, 1);
    //console.log(JSON.stringify(res.sentences,undefined,2));
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT' ]);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
  // /test.deepEqual(parsingResult, {})
 // console.log('\n' + Ast.astToText(parsingResult));
    test.deepEqual(Ast.astToText(parsingResult),
    'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
  );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testTokenizeDomain = function (test) {
  test.expect(1);
  Model.loadModels(mongooseMock).then((theModel) => {
    var s = 'domain FioriBOM';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['domain', 'DOM' ]);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testParseInDomain= function (test) {
  test.expect(2);
  Model.loadModels(mongooseMock).then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction in domain FioriBOM';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'CAT', 'in', 'domain', 'DOM' ]);
    var parsingResult = SentenceParser.parse(lexingResult, 'catListOpMore');
  // /test.deepEqual(parsingResult, {})
 // console.log('\n' + Ast.astToText(parsingResult));
    test.deepEqual(Ast.astToText(parsingResult),
  'BINOP -1(3)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  undefined\n  DOM 4\n' );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testParseEndingWith = function (test) {
  test.expect(2);
  Model.loadModels(mongooseMock).then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject ending with element';
    var res = Erbase.processString(s, theModel.rules, words);
    debuglog('res > ' + JSON.stringify(res, undefined, 2));
    var lexingResult = SentenceParser.getLexer().tokenize(res.sentences[0]);
    var sStrings = lexingResult.map(t => t.image);
    debuglog(sStrings.join('\n'));
    test.deepEqual(sStrings, ['CAT', 'ending with', 'ANY' ]);
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


exports.testparseSentenceToAstsCatCatCatParseText = function (test) {
  test.expect(1);
  Model.loadModels(mongooseMock).then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    test.deepEqual(Ast.astToText(r.asts[0]),
    'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(4)\n      CAT 0\n      CAT 1\n      CAT 2\n      CAT 3\n  LIST -1(3)\n    OPEqIn -1(2)\n      CAT 5\n      FACT 6\n    OPEqIn -1(2)\n      CAT 7\n      FACT 8\n    OPEqIn -1(2)\n      CATPH -1(0)\n      FACT 9\n'
  );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testparseSentenceStartingWith = function (test) {
  test.expect(1);
  Model.loadModels(mongooseMock).then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction with SemanticObject starting with Sup';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    test.deepEqual(Ast.astToText(r.asts[0]),
   'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(1)\n    OPStartsWith 4(2)\n      CAT 3\n      ANY 5\n'
  );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testparseSentenceToAstssError = function (test) {
  test.expect(1);
  Model.loadModels(mongooseMock).then((theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'semanticObject, SemanticAction, BSPName with UI5';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
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

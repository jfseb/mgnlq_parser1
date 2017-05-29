

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var Parser = require(root + '/parser.js');


function parseInput(text,startrule) {
  var lexingResult = Parser.SelectLexer.tokenize(text);
  const parser = new Parser.SelectParser(lexingResult.tokens);
  var res = parser[startrule]();
  //console.log('here res: ' + JSON.stringify(res));
  if (parser.errors.length > 0) {
    throw new Error('parsing error in  intput' + JSON.stringify(parser.errors));
  }
  return res;
}

exports.testParser  = function (test) {
  var inputText = 'SELECT column1 FROM table2';
  var result = parseInput(inputText, 'selectStatement');
 // console.log(Object.keys(result).join('\n')); //.selectClause());
  test.deepEqual(result, { a: 123});
  test.done();
};

exports.testParserListAll  = function (test) {
  var inputText = 'LIST ALL CAT, CAT';
  var result = parseInput(inputText,'listAll');
 // console.log(Object.keys(result).join('\n')); //.selectClause());
  test.deepEqual(result.map(a => a.image),[ 'CAT', 'CAT' ]);
  test.done();
};


/*
describe /DDF/DDEL_MON;
*/


exports.testOpCat = function (test) {
  [ 'First', 'Newest', 'Oldest', 'All'].forEach(function() {
    var inputText = 'First';
    parseInput(inputText,'opCat');
    test.equal(1,1);
  });
  test.done();
};


exports.testUnarySetOp = function (test) {
  [ 'All', 'First', 'Newest', 'Oldest','Any',  'Last', 'Every', 'All', 'At least one', 'Every'].forEach(function(val) {
    var inputText = `${val}`;
    parseInput(inputText,'unarySetOp');
    test.equal(1,1, 'for ' + val);
  });
  test.done();
};



exports.testCatListMore = function (test) {
  [ 'First', 'Newest', 'Oldest', 'All'].forEach(function() {
    var inputText = 'First CAT, CAT, CAT';
    parseInput(inputText,'catListOpMore');
    test.equal(1,1);
  });
  test.done();
};


exports.testCatListMoreInFact = function (test) {
  [ 'First', 'Newest', 'Oldest', 'All'].forEach(function() {
    var inputText = 'CAT In FACT';
    parseInput(inputText,'catListOpMore');
    test.equal(1,1);
  });
  test.done();
};

exports.testCatListMoreInFactAndFact = function (test) {
  var inputText = 'CAT, CAT in FACT, FACT'; // in FACT and FACT';
  parseInput(inputText,'catListOpMore');
  test.equal(1,1);
  test.done();
};

exports.testCatListMoreInFactAndFact2 = function (test) {
  var inputText = 'CAT, CAT, CAT in FACT'; // in FACT and FACT';
  parseInput(inputText,'catListOpMore');
  test.equal(1,1);
  test.done();
};


exports.testCatListMoreInFactCommaFact = function (test) {
  var inputText = 'CAT, CAT in FACT, FACT';
  parseInput(inputText,'catListOpMore');
  test.equal(1,1);
  test.done();
};

exports.testCatListMoreInFactCommaFact2 = function (test) {
  var inputText = 'CAT, CAT in FACT, CAT FACT';
  parseInput(inputText,'catListOpMore');
  test.equal(1,1);
  test.done();
};

exports.testCatListMoreInFactCFAndCF = function (test) {
  var inputText = 'CAT, CAT with CAT FACT , FACT , CAT FACT';
  parseInput(inputText,'catListOpMore');
  test.equal(1,1);
  test.done();
};

//'CAT', 'CAT', 'CAT', 'CAT', 'with', 'CAT', 'FACT', 'CAT', 'FACT', 'FACT'

exports.testCatListMoreInFactCFFCFnoComma = function (test) {
  var inputText = 'CAT, CAT with CAT FACT FACT  CAT FACT';
  parseInput(inputText,'catListOpMore');
  test.equal(1,1);
  test.done();
};


exports.testCatListMoreInFactCFCFFnocomma = function (test) {
  var inputText = 'CAT CAT CAT CAT with CAT FACT CAT FACT FACT';
  parseInput(inputText,'catListOpMore');
  test.equal(1,1);
  test.done();
};


/*
describe Application Component;
list all AppIds for FI-FIO-GL with ApplicationType "Reuse Component";
list all Application Component, BSPName, ODataService, fiori intent for maintain;
list all Application Components starting with FIN-;
list all ApplicationTypes for #GLAccount-manage;
List all appNames in ApplicationComponent PLM-FIO-RCP;
list all BSP Urls for ui.ssuite.s2p.mm.pur.po.create.s1;
list all categories;
list all element names starting with ni;
list all element names starting with ni in domain IUPAC;
list all example commands;
list all fiori intents in FIN-FIO-CCD with ApplicationType Analytical;
list all hints;
list all intents for FI-FIO-GL with ApplicationType "FPM/WebDynpro";
list all OData Services for retail.store.stockcorrection;
List all ODataServices for FI-FIO-GL;
make table with AppId, "fiori intent", ApplicationComponent, AppName, BusinessRoleName, BSPName;
Show me #RequestForQuotation-manage;
what are the sanitation facilities in tuvalu;
what is the "ui5 component name" for fiori intent #RequestForQuotation-manage;
what is the ApplicationComponent for sap.cus.sd.lib.processflow;
what is the ApplicationType for #ControllingDocument-setControllingArea;
What is the BSPName for Fiori App "Manage Labels";
what is the element name for element number 117;
What is the TransactionCode for Fiori App "Manage Labels"
*/
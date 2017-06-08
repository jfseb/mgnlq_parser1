

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var mQ = require(root + '/ast2MQuery.js');
var SentenceParser = require(root + '/sentenceparser.js');


var debug = require('debug')('ast2MQuery');
const Model = require('mgnlq_model').Model;


var getModel = require('mgnlq_testmodel_replay').getTestModel;

//var mongoose = require('mongoose_record_replay').instrumentMongoose(require('mongoose'),
//  'node_modules/mgnlq_testmodel_replay/mgrecrep/',
//  'RECORD');

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});

//function getModel() {
//  return Model.loadModels(mongoose);
//}

function releaseModel(theModel) {
  Model.releaseModel(theModel);
}



var words = {};

exports.testGetCategoryForNodePairEasy = function(test) {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debug(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debug(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1].children[0].children[0];
    var nodeFact = u.children[1].children[0].children[1];
    var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
    test.equals(cat, 'ApplicationComponent');
    test.done();
    releaseModel(theModel);
  });
};

exports.testGetCategoryForNodePairNoCat = function(test) {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debug(JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
    debug(JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
    var nodeCat = u.children[1].children[2].children[0];
    var nodeFact = u.children[1].children[2].children[1];
    var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
    test.equals(cat, 'TechnicalCatalog');
    test.done();
    releaseModel(theModel);
  });
};


exports.testGetCategoryForNodeOk = function(test) {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debug(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debug(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1].children[0].children[0];
    var cat =  mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
    test.equals(cat, 'ApplicationComponent');
    test.done();
    releaseModel(theModel);
  });
};



exports.testGetCategoryForNodeThrows = function(test) {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debug(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debug(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1];
    try {
      mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
      test.equals(0,1);
    } catch(e) {
      test.equals(1,1);
    }
    test.done();
    releaseModel(theModel);
  });
};


exports.testAstToMQuerySentenceToAstsCatCatCatParseText = function (test) {
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], theModel);
    test.deepEqual(match , { $match : { ApplicationComponent : 'CO-FIO', appId : 'W0052', 'TechnicalCatalog' : 'SAP_TC_FIN_CO_COMMON' }});
    var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, r.sentences[0], theModel);
    test.deepEqual(proj , { $project: { _id: 0, SemanticObject : 1, SemanticAction : 1, BSPName : 1, ApplicationComponent : 1 }});
    var group = mQ.makeMongoGroupFromAst(nodeFieldList, r.sentences[0], theModel);
    test.deepEqual(group , { $group: {
      _id:  { SemanticObject : '$SemanticObject', SemanticAction : '$SemanticAction', BSPName : '$BSPName' , ApplicationComponent : '$ApplicationComponent' }
    ,
      SemanticObject :{ $first: '$SemanticObject'}, SemanticAction : { $first: '$SemanticAction'}, BSPName : { $first: '$BSPName'} , ApplicationComponent : { $first: '$ApplicationComponent'}
    }});
    test.done();
    releaseModel(theModel);
  });
};


exports.testMakeMongoQueryEndingWith = function (test) {
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))
  // console.log(theModel.mRules)
    var s = 'domains ending with ABC';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], theModel);
    test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
    var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, r.sentences[0], theModel);
    test.deepEqual(proj ,{ '$project': { _id: 0, domain: 1 } });
    var group = mQ.makeMongoGroupFromAst(nodeFieldList, r.sentences[0], theModel);
    test.deepEqual(group , { '$group': { _id: { domain: '$domain' }, domain: { '$first': '$domain' } } }   , 'group');
    test.done();
    releaseModel(theModel);
  });
};


exports.testMakeProjection = function (test) {
  var proj  = mQ.makeMongoProjection(
    ['BSPName', 'AppKey']);
  test.deepEqual(proj,{
    '$project': { _id: 0, BSPName : 1, AppKey : 1 }
  }
  , ' projection');
  test.done();
};

exports.testMakeMatch = function (test) {
  var proj  = mQ.makeMongoMatchF(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }]);
  test.deepEqual(proj,   {
    $match: {
      BSPName : 'CPM_REUSE_MS1' }}
    , ' match');
  test.done();
};



exports.testMakeQuery = function (test) {
  var query  = mQ.makeMongoQuery(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }],
    ['BSPName', 'AppKey']
  );

  test.deepEqual(query,[
    { '$match': { BSPName: 'CPM_REUSE_MS1' } },
    { '$group': { _id: { BSPName : '$BSPName', AppKey : '$AppKey'},
      BSPName: '$BSPName', AppKey: '$AppKey' } },
    { '$project': {
      _id: 0, BSPName : 1, AppKey : 1 }}
  ], ' abc');
  test.done();
};

exports.testaddFilterToMatch0 = function(test) {
  var res = mQ.addFilterToMatch({ abc : []}, 'price', 'val');
  test.deepEqual(res,  { 'abc' : [], 'price' : 'val' });
  test.done();
};

exports.testaddFilterToMatch1 = function(test) {
  var res = mQ.addFilterToMatch({ $and : []}, 'price', 'val');
  test.deepEqual(res, { $and :  [ { 'price' : 'val'}]});
  test.done();
};

exports.testaddFilterToMatch2 = function(test) {
  var res = mQ.addFilterToMatch({ price : '123' }, 'price', 'val');
  test.deepEqual(res, { $and :  [ { 'price' : '123'}, { 'price' : 'val'}]});
  test.done();
};

exports.testaddFilterToMatch3 = function(test) {
  var res = mQ.addFilterToMatch({ price : '123' , 'other' : '445' }, 'price', 'val');
  test.deepEqual(res, { $and :  [ { 'other' : '445' }, { 'price' : '123'},  { 'price' : 'val'}]});
  test.done();
};

exports.testMakeMongoReverseMapFromAst = function (test) {
  getModel().then( (theModel) => {
    var s = 'object name';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0].children[0].children[0];
    var reverseMap = mQ.makeMongoColumnsFromAst(u,r.sentences[0],theModel);
    test.deepEqual(reverseMap,  { columns: ['object name'], reverseMap :{ 'object_name' : 'object name' }});
    test.done();
    releaseModel(theModel);
  });
};

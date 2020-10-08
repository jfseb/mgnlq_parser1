

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../js_cov' : '../../js';
var mQ = require(root + '/ast2query/ast2MQuery.js');
var Ast = require(root + '/ast.js');
var SentenceParser = require(root + '/sentenceparser.js');

var mongoQ = require(root + '/mongoq.js');

var debuglog = require('debugf')('ast2MQuery');
const Model = require('mgnlq_model').Model;

var getModel = require('mgnlq_testmodel_replay').getTestModel;

process.on('unhandledRejection', function onError(err) {
  console.log(err);
  console.log(err.stack);
  throw err;
});


function releaseModel(theModel) {
  Model.releaseModel(theModel);
}



exports.testGetCategoryForNodePairEasy = function(test) {
  var r = mQ.makeMongoName('abc DEF');
  test.equals(r, 'abc_def');
  test.done();
};

var words = {};

exports.testGetCategoryForNodePairEasy = function(test) {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
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
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
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
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(()=> JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
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
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
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
  test.expect(5);
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    debuglog(() => Object.keys(theModel.mongoHandle.mongoMaps).join('\n'));
    debuglog(() =>'collectionname ' + domainPick.collectionName);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];

    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap);
    test.deepEqual(match , { $match : { ApplicationComponent : 'CO-FIO', appId : 'W0052', 'TechnicalCatalog' : 'SAP_TC_FIN_CO_COMMON' }});
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0] );
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    test.deepEqual(proj , { $project: { _id: 0, SemanticObject : 1, SemanticAction : 1, BSPName : 1, ApplicationComponent : 1 }});
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);

    /* test bad nodetypes*/
    var nodeNoList = node;
    try {
      var res1 = mQ.getCategoryList([], nodeNoList,r.sentences[0]);
      test.deepEqual(res1,[ 'SemanticObject',
        'SemanticAction',
        'BSPName',
        'ApplicationComponent' ] );
    } catch(e) {
      test.equal(1,0);
    }
    try {
      mQ.makeMongoMatchFromAst(nodeNoList,r.sentences[0],mongoMap);
      test.equal(1,0);
    } catch(e) {
      test.equal(1,1);
    }



    test.deepEqual(group , { $group: {
      _id:  { SemanticObject : '$SemanticObject', SemanticAction : '$SemanticAction', BSPName : '$BSPName' , ApplicationComponent : '$ApplicationComponent' }
      ,
      SemanticObject :{ $first: '$SemanticObject'}, SemanticAction : { $first: '$SemanticAction'}, BSPName : { $first: '$BSPName'} , ApplicationComponent : { $first: '$ApplicationComponent'}
    }});
    test.done();
    releaseModel(theModel);
  });
};


exports.testAstToMQueryMultiArray = function (test) {
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'categories starting with elem';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], theModel.mongoHandle.mongoMaps['metamodels']);
    test.deepEqual(match , { $match : { '_categories.category' : { '$regex': /^elem/i } }});
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0] );
    var proj = mQ.makeMongoProjectionFromAst(categoryList,  theModel.mongoHandle.mongoMaps['metamodels']);
    test.deepEqual(proj , { $project: { _id: 0, 'category' : '$_categories.category' }});
    var group = mQ.makeMongoGroupFromAst(categoryList, theModel.mongoHandle.mongoMaps['metamodels']);
    test.deepEqual(group , { $group: {
      _id:  { _categories : '$_categories' }
      ,
      _categories :{ $first: '$_categories'}
    }});
    test.done();
    releaseModel(theModel);
  });
};


exports.testMakeMongoQueryEndingWith = function (test) {
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'domains ending with ABC';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap);
    test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    test.deepEqual(proj ,{ '$project': { _id: 0, domain: 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    test.deepEqual(group , { '$group': { _id: { domain: '$domain' }, domain: { '$first': '$domain' } } }   , 'group');
    test.done();
    releaseModel(theModel);
  });
};


exports.testMakeMongoQueryMoreThan = function (test) {
  getModel().then( (theModel) => {
    var s = 'sender, gründungsjahr with more than 3 standort';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap);
    test.deepEqual(match ,{ '$match':
    { '$and':
       [ { '$expr':
            { '$gt':
               [ { '$switch':
                    { branches:
                       [ { case: { '$isArray': '$standort' },
                         then: { '$size': '$standort' } } ],
                    default: 1 } },
               3 ] } } ] } });
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    test.deepEqual(proj ,{ '$project': { _id: 0, sender: 1, 'gründungsjahr': 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    test.deepEqual(group , {  '$group':
    { _id: { sender: '$sender', 'gründungsjahr': '$gründungsjahr' },
      sender: { '$first': '$sender' },
      'gründungsjahr': { '$first': '$gründungsjahr' } } }   , 'group');
    test.done();
    releaseModel(theModel);
  });
};



var fs = require('fs');
var JSONx = require('abot_utils');

exports.testParseSomeQueries = function (test) {
  getModel().then( (theModel) => {
    var filename = './test/data/sentence_ast_mongoq.json';
    var data = fs.readFileSync(filename, 'utf-8');
    var querylist = JSON.parse( data );

    for( var a in querylist )
    {
      var testrun = querylist[a];
      console.log(' test nr ' + testrun.nr  + ' query ' + testrun.query );
      var actual = { query : testrun.query };
      debuglog( ' test nr ' + testrun.nr );
      // debuglog(JSON.stringify(ifr, undefined, 2))

      var s = testrun.query; // 'domains ending with ABC';
      var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
      var node = r.asts[0];
      debuglog( JSON.stringify( r ));
      var testId = 'nr:' + testrun.nr + ' ' + testrun.query ;
      if ( !node )
      {
        test.deepEqual( true, !!testrun.parseError,  testId + '\nactual is parse error \n "parseError:"' + JSON.stringify(r.errors) + ',');
        if (testrun.parseError !=='any'
         &&  JSON.stringify( r.errors).indexOf( testrun.parseError) == -1)
          test.deepEqual( false, true , 'did not find \n' + testrun.parseError + ' in \n "parseError:"' + JSON.stringify(r.errors) + ',');
        continue;
      }

      var r2 = Ast.astToText( node , 2 );
      if ( testrun.astNice && testrun.astNice !== 'ignore' )
        test.deepEqual( r2, testrun.astNice, ' nr' + testrun.nr +  '\nexp:' + testrun.astNice + '\nact:' + r2 + '\nactual astNice is \n"astNice":' + JSON.stringify(r2) + ',');
      console.log( r2 );
      var nodeFieldList = node.children[0].children[0];
      var nodeFilter = node.children[1];
      var sentence = r.sentences[0];
      var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
      var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
      var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
      var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, domainPick.collectionName, theModel.mongoHandle);

      actual.match = match;

      var match_json = JSONx.stringify( actual.match , undefined, 2 ); // treat regexp
      actual.match_json = JSON.parse( match_json );
      test.deepEqual( actual.match_json, testrun.match_json , testId + ' actual match is \n"match_json":' + JSON.stringify( actual.match_json, undefined, 2) + ',');

      //test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
      actual.projection = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
      test.deepEqual(actual.projection, testrun.projection, testId + ' actual projection is \n "projection":' + JSON.stringify(actual.projection, undefined, 2) + ',' );
      //  ,{ '$project': { _id: 0, domain: 1 } });

      var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
      actual.group = group;
      test.deepEqual( testrun.group, actual.group, testId + 'actual group is \n"group":' +  JSON.stringify( actual.group , undefined, 2 ) );
      //test.deepEqual(group , { '$group': { _id: { domain: '$domain' }, domain: { '$first': '$domain' } } }   , 'group');

    }
    // debuglog(JSON.stringify(ifr, undefined, 2))

    /*
    var s = 'domains ending with ABC';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap);
    test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    test.deepEqual(proj ,{ '$project': { _id: 0, domain: 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    test.deepEqual(group , { '$group': { _id: { domain: '$domain' }, domain: { '$first': '$domain' } } }   , 'group');
  */
    test.done();
    releaseModel(theModel);
  });
};

exports.testParseSomeQueries2 = function (test) {
  getModel().then( (theModel) => {
    var querylist = [ { nr: 111,

      query: 'sender, standort with less than 3 standort order by gründungsjahr',
      'match_json':[
        {
          '$match': '1'
        },
        {
          '$and': '2'
        },
        [
          '3'
        ],
        {
          '$expr': '4'
        },
        {
          '$lt': '5'
        },
        [
          '6',
          3
        ],
        {
          '$switch': '7'
        },
        {
          'branches': '8',
          'default': 1
        },
        [
          '9'
        ],
        {
          'case': '10',
          'then': '11'
        },
        {
          '$isArray': '12'
        },
        {
          '$size': '12'
        },
        '$standort'
      ],
      'projection':{
        '$project': {
          '_id': 0,
          'sender': 1,
          'standort': 1
        }
      },
      'group':{
        '$group': {
          '_id': {
            'sender': '$sender',
            'standort': '$standort'
          },
          'sender': {
            '$first': '$sender'
          },
          'standort': {
            '$first': '$standort'
          }
        }
      },
      'astNice':'BINOP -1(2)\n  OPAll -1(1)\n    LIST -1(2)\n      CAT 0\n      CAT 1\n  LIST -1(2)\n    OPLessThan 3(2)\n      NUMBER 4\n      CAT 5\n    OPOrderBy 6(1)\n      CAT 7\n'
    }];
    for( var a in querylist )
    {
      var testrun = querylist[a];
      console.log(' test nr ' + testrun.nr  + ' query ' + testrun.query );
      var actual = { query : testrun.query };
      debuglog( ' test nr ' + testrun.nr );
      // debuglog(JSON.stringify(ifr, undefined, 2))

      var s = testrun.query; // 'domains ending with ABC';
      var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
      var node = r.asts[0];
      debuglog( JSON.stringify( r ));
      var testId = 'nr:' + testrun.nr + ' ' + testrun.query ;
      if ( !node )
      {
        test.deepEqual( true, !!testrun.parseError,  testId + '\nactual is parse error \n "parseError:"' + JSON.stringify(r.errors) + ',');
        if (testrun.parseError !=='any'
         &&  JSON.stringify( r.errors).indexOf( testrun.parseError) == -1)
          test.deepEqual( false, true , 'did not find \n' + testrun.parseError + ' in \n "parseError:"' + JSON.stringify(r.errors) + ',');
        continue;
      }
      var r2 = Ast.astToText( node , 2 );
      if ( testrun.astNice && testrun.astNice !== 'ignore' )
        test.deepEqual( r2, testrun.astNice, ' nr' + testrun.nr +  '\nexp:' + testrun.astNice + '\nact:' + r2 + '\nactual astNice is \n"astNice":' + JSON.stringify(r2) + ',');
      //console.log( r2 );
      var nodeFieldList = node.children[0].children[0];
      var nodeFilter = node.children[1];
      var sentence = r.sentences[0];
      var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
      var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
      var categoryList = mQ.getCategoryList([], nodeFieldList, sentence );
      var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, mongoMap, domainPick.collectionName, theModel.mongoHandle);

      actual.match = match;

      var match_json = JSONx.stringify( actual.match , undefined, 2 ); // treat regexp
      actual.match_json = JSON.parse( match_json );
      test.deepEqual( actual.match_json, testrun.match_json , testId + ' actual match is \n"match_json":' + JSON.stringify( actual.match_json, undefined, 2) + ',');

      //test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
      actual.projection = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
      test.deepEqual(actual.projection, testrun.projection, testId + ' actual projection is \n "projection":' + JSON.stringify(actual.projection, undefined, 2) + ',' );
      //  ,{ '$project': { _id: 0, domain: 1 } });

      var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
      actual.group = group;
      test.deepEqual( testrun.group, actual.group, testId + 'actual group is \n"group":' +  JSON.stringify( actual.group , undefined, 2 ) );
      //test.deepEqual(group , { '$group': { _id: { domain: '$domain' }, domain: { '$first': '$domain' } } }   , 'group');

    }
    test.done();
    releaseModel(theModel);
  });
};


exports.testGetNumberArg = function (test) {
  var res  = mQ.getNumberArg(
    /* ASTNode */
    { type : Ast.ASTNodeType.NUMBER, bearer : { startOffset : 0 } },
    [ { matchedString : '123'}]);
  test.equal( 123, res, ' number parsing');
  test.done();
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
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], u, sentence);
    var reverseMap = mQ.makeMongoColumnsFromAst(categoryList, mongoMap);
    test.deepEqual(reverseMap,  { columns: ['object name'], reverseMap :{ 'object_name' : 'object name' }});
    test.done();
    releaseModel(theModel);
  });
};

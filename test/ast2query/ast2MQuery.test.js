

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



it('testGetCategoryForNodePairEasy', done => {
  var r = mQ.makeMongoName('abc DEF');
  expect(r).toEqual('abc_def');
  done();
});

var words = {};

it('testGetCategoryForNodePairEasy', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1].children[0].children[0];
    var nodeFact = u.children[1].children[0].children[1];
    var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
    expect(cat).toEqual('ApplicationComponent');
    done();
    releaseModel(theModel);
  });
});

it('testGetCategoryForNodePairNoCat', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[2], undefined,2));
    var nodeCat = u.children[1].children[2].children[0];
    var nodeFact = u.children[1].children[2].children[1];
    var cat = mQ.getCategoryForNodePair(nodeCat, nodeFact,  r.sentences[0]);
    expect(cat).toEqual('TechnicalCatalog');
    done();
    releaseModel(theModel);
  });
});


it('testGetCategoryForNodeOk', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(()=> JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1].children[0].children[0];
    var cat =  mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
    expect(cat).toEqual('ApplicationComponent');
    done();
    releaseModel(theModel);
  });
});



it('testGetCategoryForNodeThrows', done => {
  getModel().then( (theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0];
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[0], undefined,2));
    debuglog(()=>JSON.stringify(r.asts[0].children[1].children[0].children[1], undefined,2));
    var nodeCat = u.children[1];
    try {
      mQ.getCategoryForNode(nodeCat,  r.sentences[0]);
      expect(0).toEqual(1);
    } catch(e) {
      expect(1).toEqual(1);
    }
    done();
    releaseModel(theModel);
  });
});


it('testAstToMQuerySentenceToAstsCatCatCatParseText', done => {
  expect.assertions(5);
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
    expect(match).toEqual(
      { $match : { ApplicationComponent : 'CO-FIO', appId : 'W0052', 'TechnicalCatalog' : 'SAP_TC_FIN_CO_COMMON' }}
    );
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0] );
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    expect(proj).toEqual(
      { $project: { _id: 0, SemanticObject : 1, SemanticAction : 1, BSPName : 1, ApplicationComponent : 1 }}
    );
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);

    /* test bad nodetypes*/
    var nodeNoList = node;
    try {
      var res1 = mQ.getCategoryList([], nodeNoList,r.sentences[0]);
      expect(res1).toEqual([ 'SemanticObject',
        'SemanticAction',
        'BSPName',
        'ApplicationComponent' ]);
    } catch(e) {
      expect(1).toEqual(0);
    }
    try {
      mQ.makeMongoMatchFromAst(nodeNoList,r.sentences[0],mongoMap);
      expect(1).toEqual(0);
    } catch(e) {
      expect(1).toEqual(1);
    }



    expect(group).toEqual({ $group: {
      _id:  { SemanticObject : '$SemanticObject', SemanticAction : '$SemanticAction', BSPName : '$BSPName' , ApplicationComponent : '$ApplicationComponent' }
      ,
      SemanticObject :{ $first: '$SemanticObject'}, SemanticAction : { $first: '$SemanticAction'}, BSPName : { $first: '$BSPName'} , ApplicationComponent : { $first: '$ApplicationComponent'}
    }});
    done();
    releaseModel(theModel);
  });
});


it('testAstToMQueryMultiArray', done => {
  getModel().then( (theModel) => {
  // debuglog(JSON.stringify(ifr, undefined, 2))

    var s = 'categories starting with elem';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], theModel.mongoHandle.mongoMaps['metamodels']);
    expect(match).toEqual({ $match : { '_categories.category' : { '$regex': /^elem/i } }});
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0] );
    var proj = mQ.makeMongoProjectionFromAst(categoryList,  theModel.mongoHandle.mongoMaps['metamodels']);
    expect(proj).toEqual({ $project: { _id: 0, 'category' : '$_categories.category' }});
    var group = mQ.makeMongoGroupFromAst(categoryList, theModel.mongoHandle.mongoMaps['metamodels']);
    expect(group).toEqual({ $group: {
      _id:  { _categories : '$_categories' }
      ,
      _categories :{ $first: '$_categories'}
    }});
    done();
    releaseModel(theModel);
  });
});


it('testMakeMongoQueryEndingWith', done => {
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
    expect(match).toEqual({ '$match': { domain: { '$regex': /abc$/i } } });
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    expect(proj).toEqual({ '$project': { _id: 0, domain: 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    expect(group).toEqual(
      { '$group': { _id: { domain: '$domain' }, domain: { '$first': '$domain' } } }
    );
    done();
    releaseModel(theModel);
  });
});


it('testMakeMongoQueryMoreThan', done => {
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
    expect(match).toEqual({ '$match':
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
    expect(proj).toEqual({ '$project': { _id: 0, sender: 1, 'gründungsjahr': 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    expect(group).toEqual({  '$group':
    { _id: { sender: '$sender', 'gründungsjahr': '$gründungsjahr' },
      sender: { '$first': '$sender' },
      'gründungsjahr': { '$first': '$gründungsjahr' } } });
    done();
    releaseModel(theModel);
  });
});



var fs = require('fs');
var JSONx = require('abot_utils');

it('testParseSomeQueries', done => {
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
      console.log(testId);
      if ( !node )
      {
        expect(true).toEqual(!!testrun.parseError);
        if (testrun.parseError !=='any'
         &&  JSON.stringify( r.errors).indexOf( testrun.parseError) == -1)
          expect(false).toEqual( JSON.stringify(r.errors) + ' does not contain ' + testrun.parseError);
        continue;
      }

      var r2 = Ast.astToText( node , 2 );
      if ( testrun.astNice && testrun.astNice !== 'ignore' )
        expect(r2).toEqual(testrun.astNice);
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
      expect(actual.match_json).toEqual(testrun.match_json);

      //test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
      actual.projection = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
      expect(actual.projection).toEqual(testrun.projection);
      //  ,{ '$project': { _id: 0, domain: 1 } });

      var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
      actual.group = group;
      expect(testrun.group).toEqual(actual.group);

    }
    done();
    releaseModel(theModel);
  });
});

it('testParseSomeQueries2', done => {
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
        expect(true).toEqual(!!testrun.parseError);
        if (testrun.parseError !=='any'
         &&  JSON.stringify( r.errors).indexOf( testrun.parseError) == -1)
          expect(false).toEqual(testId + ' expected  ' + JSON.stringify(r.errors) + ' shall contain ' + testrun.parseError);
        continue;
      }
      var r2 = Ast.astToText( node , 2 );
      if ( testrun.astNice && testrun.astNice !== 'ignore' )
        expect(r2).toEqual(testrun.astNice);
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
      expect(actual.match_json).toEqual(testrun.match_json);

      //test.deepEqual(match ,{ '$match': { domain: { '$regex': /abc$/i } } });
      actual.projection = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
      expect(actual.projection).toEqual(testrun.projection);
      //  ,{ '$project': { _id: 0, domain: 1 } });

      var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
      actual.group = group;
      expect(testrun.group).toEqual(actual.group);

    }
    done();
    releaseModel(theModel);
  });
});


it('testGetNumberArg', done => {
  var res  = mQ.getNumberArg(
    /* ASTNode */
    { type : Ast.ASTNodeType.NUMBER, bearer : { startOffset : 0 } },
    [ { matchedString : '123'}]);
  expect(123).toEqual(res);
  done();
});



it('testMakeProjection', done => {
  var proj  = mQ.makeMongoProjection(
    ['BSPName', 'AppKey']);
  expect(proj).toEqual({
    '$project': { _id: 0, BSPName : 1, AppKey : 1 }
  });
  done();
});

it('testMakeMatch', done => {
  var proj  = mQ.makeMongoMatchF(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }]);
  expect(proj).toEqual({
    $match: {
      BSPName : 'CPM_REUSE_MS1' }});
  done();
});



it('testMakeQuery', done => {
  var query  = mQ.makeMongoQuery(
    [{
      cat : 'BSPName',
      value : 'CPM_REUSE_MS1'
    }],
    ['BSPName', 'AppKey']
  );

  expect(query).toEqual([
    { '$match': { BSPName: 'CPM_REUSE_MS1' } },
    { '$group': { _id: { BSPName : '$BSPName', AppKey : '$AppKey'},
      BSPName: '$BSPName', AppKey: '$AppKey' } },
    { '$project': {
      _id: 0, BSPName : 1, AppKey : 1 }}
  ]);
  done();
});

it('testaddFilterToMatch0', done => {
  var res = mQ.addFilterToMatch({ abc : []}, 'price', 'val');
  expect(res).toEqual({ 'abc' : [], 'price' : 'val' });
  done();
});

it('testaddFilterToMatch1', done => {
  var res = mQ.addFilterToMatch({ $and : []}, 'price', 'val');
  expect(res).toEqual({ $and :  [ { 'price' : 'val'}]});
  done();
});

it('testaddFilterToMatch2', done => {
  var res = mQ.addFilterToMatch({ price : '123' }, 'price', 'val');
  expect(res).toEqual({ $and :  [ { 'price' : '123'}, { 'price' : 'val'}]});
  done();
});

it('testaddFilterToMatch3', done => {
  var res = mQ.addFilterToMatch({ price : '123' , 'other' : '445' }, 'price', 'val');
  expect(res).toEqual({ $and :  [ { 'other' : '445' }, { 'price' : '123'},  { 'price' : 'val'}]});
  done();
});

it('testMakeMongoReverseMapFromAst', done => {
  getModel().then( (theModel) => {
    var s = 'object name';
    var r = SentenceParser.parseSentenceToAsts(s,theModel,words);
    var u = r.asts[0].children[0].children[0];
    var sentence = r.sentences[0];
    var domainPick = mongoQ.getDomainInfoForSentence(theModel, sentence);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var categoryList = mQ.getCategoryList([], u, sentence);
    var reverseMap = mQ.makeMongoColumnsFromAst(categoryList, mongoMap);
    expect(reverseMap).toEqual({ columns: ['object name'], reverseMap :{ 'object_name' : 'object name' }});
    done();
    releaseModel(theModel);
  });
});

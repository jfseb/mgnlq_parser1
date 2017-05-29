var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var mQ = require(root + '/ast2MQuery.js');
var mongoQ = require(root + '/mongoq.js');

var SentenceParser = require(root + '/sentenceparser.js');

var debug = require('debug')('mongoq.nunit');
const Model = require('mgnlq_model').Model;

//var modelpath = process.env.ABOT_MODELPATH || undefined;

//var theModel = Model.loadModels(modelpath);

var mongooseMock = require('mongoose_record_replay').instrumentMongoose(require('mongoose'),
  'node_modules/mgnlq_testmodel_replay/mgrecrep/',
  'REPLAY');

var words = {};

exports.testMakeMongoDomain = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var mongoBridge = new mongoQ.MongoBridge(theModel);
    var res = mongoBridge.mongoooseDomainToDomain('FioriBOM');
    test.equal(res, 'FioriBOM', 'bad result');
    test.done();
    Model.releaseModel(theModel);
  });
};

process.on('unhandledRejection', function (err) {
  console.log('wow, here you go' + err);
  console.log('  ' + err.stack);
});

exports.testMakeQuery = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var r = mongoQ.prepareQueries('\'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052',
      theModel);
    test.deepEqual(r.queries, [{
      domain: 'FioriBOM',
      collectionName: 'FioriBOM',
      columns: ['SemanticObject', 'SemanticAction', 'BSPName', 'ApplicationComponent'],
      reverseMap: {},
      query: [{ '$match': { ApplicationComponent: 'CO-FIO', appId: 'W0052' } },
        {
          '$group': {
            _id: {
              SemanticObject: '$SemanticObject',
              SemanticAction: '$SemanticAction',
              BSPName: '$BSPName',
              ApplicationComponent: '$ApplicationComponent'
            },
            SemanticObject: { '$first': '$SemanticObject' },
            SemanticAction: { '$first': '$SemanticAction' },
            BSPName: { '$first': '$BSPName' },
            ApplicationComponent: { '$first': '$ApplicationComponent' }
          }
        },
        {
          '$project': {
            _id: 0,
            SemanticObject: 1,
            SemanticAction: 1,
            BSPName: 1,
            ApplicationComponent: 1
          }
        }]
    }]);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testMakeQuerySimple = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var r = mongoQ.prepareQueries('object name', theModel);
    test.deepEqual(r.queries,
      [{
        domain: 'Cosmos',
        collectionName: 'Cosmos',
        columns: ['object name'],
        reverseMap: { 'object_name': 'object name' },
        query: [{ '$match': {} },
          {
            '$group': {
              _id: { 'object_name': '$object_name' },
              'object_name': { '$first': '$object_name' }
            }
          },
        { '$project': { _id: 0, 'object_name': 1 } }
        ]
      },
        undefined]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testMakeQueryDoubleConstraint = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var r = mongoQ.prepareQueries('AppNAme with AppNAme starting with "Sup" AppNAme containing Obj',
      theModel);
    test.deepEqual(r.queries,
      [{
        domain: 'FioriBOM',
        collectionName: 'FioriBOM',
        columns: ['AppName'],
        reverseMap: {},
        query:
        [{
          '$match':
          {
            '$and':
            [{ AppName: { '$regex': /^sup/i } },
            { AppName: { '$regex': /obj/i } }]
          }
        },
        {
          '$group':
          {
            _id: { AppName: '$AppName' },
            AppName: { '$first': '$AppName' }
          }
        },
        { '$project': { _id: 0, AppName: 1 } }]
      },
        undefined]);
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testMakeQueryStartingWith2 = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var r = mongoQ.prepareQueries('SemanticAction with SemanticAction starting with "Sup"',
      theModel);
    test.deepEqual(r.queries,
      [
        {
          domain: 'FioriBOM',
          collectionName: 'FioriBOM',
          columns: ['SemanticAction'],
          reverseMap: {},
          query:
          [{ '$match': { SemanticAction: { '$regex': /^sup/i } } },
            {
              '$group':
              {
                _id: { SemanticAction: '$SemanticAction' },
                SemanticAction: { '$first': '$SemanticAction' }
              }
            },
        { '$project': { _id: 0, SemanticAction: 1 } }]
        },
        {
          domain: 'Fiori Backend Catalogs',
          collectionName: 'Fiori_Backend_Catalogs',
          columns: ['SemanticAction'],
          reverseMap: {},
          query:
          [{ '$match': { SemanticAction: { '$regex': /^sup/i } } },
            {
              '$group':
              {
                _id: { SemanticAction: '$SemanticAction' },
                SemanticAction: { '$first': '$SemanticAction' }
              }
            },
        { '$project': { _id: 0, SemanticAction: 1 } }]
        },
        undefined]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testMakeQueryStartingWith = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var r = mongoQ.prepareQueries('SemanticAction starting with "Sup"',
      theModel);
    test.deepEqual(r.queries,
      [
        {
          domain: 'FioriBOM',
          collectionName: 'FioriBOM',
          columns: ['SemanticAction'],
          reverseMap: {},
          query:
          [{ '$match': { SemanticAction: { '$regex': /^sup/i } } },
            {
              '$group':
              {
                _id: { SemanticAction: '$SemanticAction' },
                SemanticAction: { '$first': '$SemanticAction' }
              }
            },
        { '$project': { _id: 0, SemanticAction: 1 } }]
        },

        {
          domain: 'Fiori Backend Catalogs',
          collectionName: 'Fiori_Backend_Catalogs',
          columns: ['SemanticAction'],
          reverseMap: {},
          query:
          [{ '$match': { SemanticAction: { '$regex': /^sup/i } } },
            {
              '$group':
              {
                _id: { SemanticAction: '$SemanticAction' },
                SemanticAction: { '$first': '$SemanticAction' }
              }
            },
        { '$project': { _id: 0, SemanticAction: 1 } }]
        },
        undefined
      ]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testMakeQueryContaining = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var r = mongoQ.prepareQueries('UI5Component containing "DYN"',
      theModel);
    debug(JSON.stringify(r, undefined, 2));
    test.deepEqual(r.queries,
      [
        {
          domain: 'FioriBOM',
          collectionName: 'FioriBOM',
          columns: ['ApplicationComponent'],
          reverseMap: {},
          query:
          [{ '$match': { ApplicationComponent: { '$regex': /dyn/i } } },
            {
              '$group':
              {
                _id: { ApplicationComponent: '$ApplicationComponent' },
                ApplicationComponent: { '$first': '$ApplicationComponent' }
              }
            },
          { '$project': { _id: 0, ApplicationComponent: 1 } }]
        },
        {
          domain: 'FioriBOM',
          collectionName: 'FioriBOM',
          columns: ['ArtifactId'],
          reverseMap: {},
          query:
          [{ '$match': { ArtifactId: { '$regex': /dyn/i } } },
            {
              '$group':
              {
                _id: { ArtifactId: '$ArtifactId' },
                ArtifactId: { '$first': '$ArtifactId' }
              }
            },
          { '$project': { _id: 0, ArtifactId: 1 } }]
        }]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testMakeQueryContainsFact = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var r = mongoQ.prepareQueries('element names for element name containing rium 10',
      theModel);
    test.deepEqual(r.queries,
      [{
        domain: 'IUPAC',
        collectionName: 'IUPAC',
        columns: ['element name'],
        reverseMap: { element_name: 'element name' },
        query:
        [{ '$match': { element_name: { '$regex': /rium/i }, element_number: '10' } },
          {
            '$group':
            {
              _id: { element_name: '$element_name' },
              element_name: { '$first': '$element_name' }
            }
          },
        { '$project': { _id: 0, element_name: 1 } }]
      },
      {
        domain: 'IUPAC',
        collectionName: 'IUPAC',
        columns: ['element name'],
        reverseMap: { element_name: 'element name' },
        query:
        [{
          '$match':
          {
            '$and':
            [{ element_number: { '$regex': /rium/i } },
            { element_number: '10' }]
          }
        },
        {
          '$group':
          {
            _id: { element_name: '$element_name' },
            element_name: { '$first': '$element_name' }
          }
        },
        { '$project': { _id: 0, element_name: 1 } }]
      },
      {
        domain: 'IUPAC',
        collectionName: 'IUPAC',
        columns: ['element number'],
        reverseMap: { element_number: 'element number' },
        query:
        [{ '$match': { element_name: { '$regex': /rium/i }, element_number: '10' } },
          {
            '$group':
            {
              _id: { element_number: '$element_number' },
              element_number: { '$first': '$element_number' }
            }
          },
        { '$project': { _id: 0, element_number: 1 } }]
      },
      {
        domain: 'IUPAC',
        collectionName: 'IUPAC',
        columns: ['element number'],
        reverseMap: { element_number: 'element number' },
        query:
        [{
          '$match':
          {
            '$and':
            [{ element_number: { '$regex': /rium/i } },
            { element_number: '10' }]
          }
        },
        {
          '$group':
          {
            _id: { element_number: '$element_number' },
            element_number: { '$first': '$element_number' }
          }
        },
        { '$project': { _id: 0, element_number: 1 } }]
      }]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


var FakeHandle = function (result) {
  var that = this;
  return {
    query: function (domain, q) {
      that.domain = domain;
      that.query = q;
      return Promise.resolve(result);
    }
  };
};

exports.testQueryInternal = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var handle = new FakeHandle([{ 'object_name': 'abc' }]);
    mongoQ.queryInternal('object name', theModel, handle).then(res => {
      test.deepEqual(res.queryresults,
        [
          { sentence:
          [ { string: 'object name',
            matchedString: 'object name',
            category: 'category',
            rule:
            { category: 'category',
              matchedString: 'object name',
              type: 0,
              word: 'object name',
              lowercaseword: 'object name',
              bitindex: 1,
              wordType: 'C',
              bitSentenceAnd: 1,
              _ranking: 0.95 },
            _ranking: 0.95,
            span: 2 } ],
            columns: [ 'object name' ],
            results: [ [ 'abc' ] ] },
          { sentence:
          [ { string: 'object name',
            matchedString: 'object name',
            category: 'category',
            rule:
            { category: 'category',
              matchedString: 'object name',
              type: 0,
              word: 'object name',
              bitindex: 16,
              bitSentenceAnd: 16,
              exactOnly: false,
              wordType: 'F',
              _ranking: 0.95,
              lowercaseword: 'object name' },
            _ranking: 0.95,
            span: 2 } ],
            columns: [],
            results: [] } ]

      );
      test.done();
      Model.releaseModel(theModel);
    });
  });
};

exports.testMakeQuery2 = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], theModel);
    test.deepEqual(match, { $match: { ApplicationComponent: 'CO-FIO', appId: 'W0052', 'TechnicalCatalog': 'SAP_TC_FIN_CO_COMMON' } });
    var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, r.sentences[0], theModel);
    test.deepEqual(proj, { $project: { _id: 0, SemanticObject: 1, SemanticAction: 1, BSPName: 1, ApplicationComponent: 1 } });
    var group = mQ.makeMongoGroupFromAst(nodeFieldList, r.sentences[0], theModel);
    test.deepEqual(group, {
      $group: {
        _id: { SemanticObject: '$SemanticObject', SemanticAction: '$SemanticAction', BSPName: '$BSPName', ApplicationComponent: '$ApplicationComponent' },
        SemanticObject: { $first: '$SemanticObject' }, SemanticAction: { $first: '$SemanticAction' }, BSPName: { $first: '$BSPName' }, ApplicationComponent: { $first: '$ApplicationComponent' }
      }
    });
    // console.log(JSON.stringify(r)); // how to get domain?
    var domain = mongoQ.getDomainForSentence(theModel, r.sentences[0]);
    test.deepEqual(domain, { collectionName: 'FioriBOM', domain: 'FioriBOM' }, ' got domain');
    var query = [match, group, proj];
    debug(query);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testGetDomainsForSentence = function (test) {
  Model.loadModels(mongooseMock).then((theModel) => {
    var s = 'SemanticObject';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var domain = mongoQ.getDomainForSentence(theModel, r.sentences[0]);
    test.deepEqual(domain, { domain: 'FioriBOM', collectionName: 'FioriBOM' }, ' got domain');
    var domain2 = mongoQ.getDomainForSentence(theModel, r.sentences[1]);
    test.deepEqual(domain2, {
      domain: 'Fiori Backend Catalogs',
      collectionName: 'Fiori_Backend_Catalogs'
    }, ' got domain');
    test.done();
    Model.releaseModel(theModel);
  });
};

var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var mQ = require(root + '/ast2MQuery.js');
var MongoQ = require(root + '/mongoq.js');


var SentenceParser = require(root + '/sentenceparser.js');

var debuglog = require('debug')('mongoq.nunit');
const Model = require('mgnlq_model').Model;

//var modelpath = process.env.ABOT_MODELPATH || undefined;

//var theModel = Model.loadModels(modelpath);

var getModel = require('mgnlq_testmodel_replay').getTestModel;

var words = {};

exports.testMakeMongoDomain = function (test) {
  getModel().then((theModel) => {
    var mongoBridge = new MongoQ.MongoBridge(theModel);
    var res = mongoBridge.mongoooseDomainToDomain('FioriBOM');
    test.equal(res, 'FioriBOM', 'bad result');
    test.done();
    Model.releaseModel(theModel);
  });
};



exports.testMakeMongoDomain = function (test) {
  getModel().then((theModel) => {
    var res = MongoQ.augmentCategoriesWithURI(['_url', 'orbits'], theModel, 'Cosmos');
    test.deepEqual(res, ['_url', 'orbits'], 'bad result');
    res = res = MongoQ.augmentCategoriesWithURI(['orbits'], theModel, 'Cosmos');
    test.deepEqual(res, ['_url', 'orbits'], 'bad result');
    res = res = MongoQ.augmentCategoriesWithURI(['orbits', 'abc'], theModel, 'FioriBOM');
    test.deepEqual(res, ['uri', 'uri_rank', 'orbits', 'abc'], 'bad result');
    test.done();
    Model.releaseModel(theModel);
  });
};


process.on('unhandledRejection', function (err) {
  console.log('wow, here you go' + err);
  console.log('  ' + err.stack);
});

exports.testMakeQuery = function (test) {
  getModel().then((theModel) => {
    var r = MongoQ.prepareQueries('\'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052',
      theModel, []);
    test.deepEqual(r.queries, [{
      domain: 'FioriBOM',
      collectionName: 'fioriapps',
      columns: ['SemanticObject', 'SemanticAction', 'BSPName', 'ApplicationComponent'],
      auxcolumns: [],
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
        },
        {
          '$sort': {
            SemanticObject: 1,
            SemanticAction: 1,
            BSPName: 1,
            ApplicationComponent: 1
          }
        }
      ]
    }]);
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testMakeQuerySimple = function (test) {
  getModel().then((theModel) => {
    var r = MongoQ.prepareQueries('object name', theModel, []);
    test.deepEqual(r.queries,
      [{
        domain: 'Cosmos',
        collectionName: 'cosmos',
        columns: ['object name'],
        auxcolumns: [],
        reverseMap: { 'object_name': 'object name' },
        query: [{ '$match': {} },
          {
            '$group': {
              _id: { 'object_name': '$object_name' },
              'object_name': { '$first': '$object_name' }
            }
          },
        { '$project': { _id: 0, 'object_name': 1 } },
        { '$sort': { object_name: 1 } }
        ]
      },
        undefined]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testMakeQueryDoubleConstraint = function (test) {
  getModel().then((theModel) => {
    var r = MongoQ.prepareQueries('AppNAme with AppNAme starting with "Sup" AppNAme containing Obj',
      theModel, []);
    test.deepEqual(r.queries,
      [{
        domain: 'FioriBOM',
        collectionName: 'fioriapps',
        columns: ['AppName'],
        auxcolumns: [],
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
        { '$project': { _id: 0, AppName: 1 } },
        { '$sort': { AppName: 1 } }]
      },
        undefined]);
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testMakeQueryStartingWith2 = function (test) {
  getModel().then((theModel) => {
    var r = MongoQ.prepareQueries('SemanticAction with SemanticAction starting with "Sup"',
      theModel, []);
    test.deepEqual(r.queries,
      [
        {
          domain: 'FioriBOM',
          collectionName: 'fioriapps',
          columns: ['SemanticAction'],
          auxcolumns: [],
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
          { '$project': { _id: 0, SemanticAction: 1 } },
          { '$sort': { SemanticAction: 1 } }]
        },
        {
          domain: 'Fiori Backend Catalogs',
          collectionName: 'fioribecatalogs',
          columns: ['SemanticAction'],
          auxcolumns: [],
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
          { '$project': { _id: 0, SemanticAction: 1 } },
          { '$sort': { SemanticAction: 1 } }]
        },
        undefined]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testMakeQueryStartingWith = function (test) {
  getModel().then((theModel) => {
    var r = MongoQ.prepareQueries('SemanticAction starting with "Sup"',
      theModel, []);
    test.deepEqual(r.queries,
      [
        {
          domain: 'FioriBOM',
          collectionName: 'fioriapps',
          columns: ['SemanticAction'],
          auxcolumns: [],
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
          { '$project': { _id: 0, SemanticAction: 1 } },
          { '$sort': { SemanticAction: 1 } }
          ]
        },

        {
          domain: 'Fiori Backend Catalogs',
          collectionName: 'fioribecatalogs',
          columns: ['SemanticAction'],
          auxcolumns: [],
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
          { '$project': { _id: 0, SemanticAction: 1 } },
          { '$sort': { SemanticAction: 1 } }
          ]
        },
        undefined
      ]
    );
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testMakeQueryContaining = function (test) {
  getModel().then((theModel) => {
    var r = MongoQ.prepareQueries('UI5Component containing "DYN"',
      theModel, []);
    debuglog(() => JSON.stringify(r, undefined, 2));


    var expected = [{
      domain: 'FioriBOM',
      collectionName: 'fioriapps',
      columns: ['ApplicationComponent'],
      auxcolumns: [],

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
      { '$project': { _id: 0, ApplicationComponent: 1 } },
      { '$sort': { ApplicationComponent: 1 } }]
    },
    {
      domain: 'Fiori Backend Catalogs',
      collectionName: 'fioribecatalogs',
      columns: ['ApplicationComponent'],
      auxcolumns: [],

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
      { '$project': { _id: 0, ApplicationComponent: 1 } },
      { '$sort': { ApplicationComponent: 1 } }]
    },
      undefined,
    {
      domain: 'FioriBOM',
      collectionName: 'fioriapps',
      columns: ['ArtifactId'],
      auxcolumns: [],
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
      { '$project': { _id: 0, ArtifactId: 1 } },
      { '$sort': { ArtifactId: 1 } }]
    },
      undefined];
    test.deepEqual(r.queries[0], expected[0]);
    test.deepEqual(r.queries[2], expected[2]);
    test.deepEqual(r.queries,
      expected
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testMakeQueryContainsFact = function (test) {
  getModel().then((theModel) => {
    var r = MongoQ.prepareQueries('element names for element name containing rium 10',
      theModel, []);
    test.deepEqual(r.queries,
      [{
        domain: 'IUPAC',
        collectionName: 'iupacs',
        columns: ['element name'],
        auxcolumns: [],
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
        { '$project': { _id: 0, element_name: 1 } },
        { '$sort': { element_name: 1 } }]
      },
      {
        domain: 'IUPAC',
        collectionName: 'iupacs',
        columns: ['element name'],
        auxcolumns: [],
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
        { '$project': { _id: 0, element_name: 1 } },
        { '$sort': { element_name: 1 } }]
      },
      {
        domain: 'IUPAC',
        collectionName: 'iupacs',
        columns: ['element number'],
        auxcolumns: [],
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
        { '$project': { _id: 0, element_number: 1 } },
        { '$sort': { element_number: 1 } }]
      },
      {
        domain: 'IUPAC',
        collectionName: 'iupacs',
        columns: ['element number'],
        auxcolumns: [],
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
        { '$project': { _id: 0, element_number: 1 } },
        { '$sort': { element_number: 1 } }]
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
  getModel().then((theModel) => {
    var handle = new FakeHandle([{ 'object_name': 'abc' }]);
    MongoQ.queryInternal('object name', theModel, handle).then(res => {
      var expected =
        [
          {
            errors: false,
            domain: 'Cosmos',
            aux: {
              sentence:
              [{
                string: 'object name',
                matchedString: 'object name',
                category: 'category',
                rule:
                {
                  category: 'category',
                  matchedString: 'object name',
                  type: 0,
                  word: 'object name',
                  lowercaseword: 'object name',
                  bitindex: 1,
                  wordType: 'C',
                  bitSentenceAnd: 1,
                  _ranking: 0.95
                },
                _ranking: 0.95,
                span: 2
              }],
              tokens: ['object', 'name']
            },
            columns: ['object name'],
            auxcolumns: [],
            results: [{ 'object name': 'abc' }]
          },
          {
            domain: 'metamodel',
            errors: {
              err_code: undefined,
              text: 'Error: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[ACategory]> but found: \'FACT\''
            },
            aux: {
              sentence:
              [{
                string: 'object name',
                matchedString: 'object name',
                category: 'category',
                rule:
                {
                  category: 'category',
                  matchedString: 'object name',
                  type: 0,
                  word: 'object name',
                  bitindex: 16,
                  bitSentenceAnd: 16,
                  exactOnly: false,
                  wordType: 'F',
                  _ranking: 0.95,
                  lowercaseword: 'object name'
                },
                _ranking: 0.95,
                span: 2
              }],
              tokens: ['object', 'name']
            },
            columns: [],
            auxcolumns: [],
            results: []
          }];
      test.deepEqual(res[0], expected[0], 'first ok');
      test.deepEqual(res[0].aux, expected[0].aux, 'first aux ok');

      // test.deepEqual(res[1], expected[1], '2nd ok');
      test.deepEqual(res, expected);
      test.done();
      Model.releaseModel(theModel);
    });
  });
};

exports.testMakeQuery2 = function (test) {
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var domainPick = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0]);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], mongoMap);
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0]);
    test.deepEqual(match, { $match: { ApplicationComponent: 'CO-FIO', appId: 'W0052', 'TechnicalCatalog': 'SAP_TC_FIN_CO_COMMON' } });
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    test.deepEqual(proj, { $project: { _id: 0, SemanticObject: 1, SemanticAction: 1, BSPName: 1, ApplicationComponent: 1 } });
    var sort = mQ.makeMongoSortFromAst(categoryList, mongoMap);
    test.deepEqual(sort, { $sort: { SemanticObject: 1, SemanticAction: 1, BSPName: 1, ApplicationComponent: 1 } });
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    test.deepEqual(group, {
      $group: {
        _id: { SemanticObject: '$SemanticObject', SemanticAction: '$SemanticAction', BSPName: '$BSPName', ApplicationComponent: '$ApplicationComponent' },
        SemanticObject: { $first: '$SemanticObject' }, SemanticAction: { $first: '$SemanticAction' }, BSPName: { $first: '$BSPName' }, ApplicationComponent: { $first: '$ApplicationComponent' }
      }
    });
    // console.log(JSON.stringify(r)); // how to get domain?
    var domain = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0], mongoMap);
    test.deepEqual(domain, { collectionName: 'fioriapps', domain: 'FioriBOM', modelName: 'fioriapps' }, ' got domain');
    var query = [match, group, proj];
    debuglog(() => query);
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testCategoriesInBOM = function (test) {
  getModel().then((theModel) => {
    var s = 'categories in  Fiori BOM';
    var r = MongoQ.prepareQueries(s, theModel, []);
    debuglog(() => JSON.stringify(r, undefined, 2));
    var query0 = r.queries[0];
    test.deepEqual(r.queries.length, 2);
    test.deepEqual(r.queries.filter(q => !!q).length, 1);
    test.deepEqual(query0.query,
      [{ '$match': { domain: 'FioriBOM' } },
      { '$unwind': { path: '$_categories', preserveNullAndEmptyArrays: true } },
      { '$match': { domain: 'FioriBOM' } },
        {
          '$group':
          {
            _id: { _categories: '$_categories' },
            _categories: { '$first': '$_categories' }
          }
        },
      { '$project': { _id: 0, category: '$_categories.category' } },
      { '$sort': { category: 1 } }]
    );
    test.deepEqual(query0.columns,
      ['category']
    );
    test.deepEqual(query0.reverseMap,
      {}
    );
    test.done();
    Model.releaseModel(theModel);
  });
};



exports.testPrepareQuery2 = function (test) {
  getModel().then((theModel) => {
    var s = 'categories starting with elem';
    var r = MongoQ.prepareQueries(s, theModel, []);
    var query0 = r.queries[0];

    test.deepEqual(query0.query,
      [
        {
          '$match': {
            '_categories.category': {
              '$regex': /^elem/i
            }
          }
        },
        {
          '$unwind': {
            'path': '$_categories',
            'preserveNullAndEmptyArrays': true
          }
        },
        {
          '$match': {
            '_categories.category': {
              '$regex': /^elem/i
            }
          }
        },
        {
          '$group': {
            '_id': {
              '_categories': '$_categories'
            },
            '_categories': {
              '$first': '$_categories'
            }
          }
        },
        {
          '$project': {
            '_id': 0,
            'category': '$_categories.category'
          }
        },
        {
          '$sort': {
            'category': 1
          }
        }
      ]);
    test.deepEqual(query0.columns,
      ['category']
    );
    test.deepEqual(query0.reverseMap,
      {}
    );
    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testGetDomainsForSentence = function (test) {
  getModel().then((theModel) => {
    var s = 'SemanticObject';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var domain = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0]);
    test.deepEqual(domain, { domain: 'FioriBOM', collectionName: 'fioriapps', modelName: 'fioriapps' }, ' got domain');
    var domain2 = MongoQ.getDomainInfoForSentence(theModel, r.sentences[1]);
    test.deepEqual(domain2, {
      domain: 'Fiori Backend Catalogs',
      collectionName: 'fioribecatalogs',
      modelName: 'fioribecatalogs'
    }, ' got domain');
    test.done();
    Model.releaseModel(theModel);
  });
};


exports.testContainsFixedCategories = function (test) {
  getModel().then((theModel) => {
    test.deepEqual(MongoQ.containsFixedCategories(theModel, 'Cosmos', []), true, 'empty is always ok');
    test.deepEqual(MongoQ.containsFixedCategories(theModel, 'Cosmos', ['nocat']), false, ' missing ');
    test.deepEqual(MongoQ.containsFixedCategories(theModel, 'Cosmos', ['orbits']), true, ' missing ');
    test.deepEqual(MongoQ.containsFixedCategories(theModel, 'Cosmos', ['orbits', 'nocat']), false, ' missing ');

    // now a hidden category
    test.deepEqual(MongoQ.containsFixedCategories(theModel, 'FioriBOM', ['uri', 'uri_rank']), true, ' uri present ');

    test.done();
    Model.releaseModel(theModel);
  });
};

exports.testGetDomainsForSentence = function (test) {
  getModel().then((theModel) => {
    var s = 'SemanticObject';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var domain = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0]);
    test.deepEqual(domain, { domain: 'FioriBOM', collectionName: 'fioriapps', modelName: 'fioriapps' }, ' got domain');
    var domain2 = MongoQ.getDomainInfoForSentence(theModel, r.sentences[1]);
    test.deepEqual(domain2, {
      domain: 'Fiori Backend Catalogs',
      collectionName: 'fioribecatalogs',
      modelName: 'fioribecatalogs'
    }, ' got domain');
    MongoQ.query('SemanticObject', theModel).then((res) => {
      test.deepEqual(MongoQ.projectResultToArray(res[0]),
        [
          [
            null
          ],
          [
            ''
          ],
          [
            'ApplicationJob'
          ],
          [
            'ComplianceAlerts'
          ],
          [
            'EWMProduct'
          ],
          [
            'GLAccount'
          ],
          [
            'MRPMaterial'
          ],
          [
            'ProductLabel'
          ],
          [
            'Project'
          ],
          [
            'Supplier'
          ],
          [
            'TaxReport'
          ],
          [
            'WBSElement'
          ]
        ]);

      test.deepEqual(res[1].results, [
        {
          'SemanticObject': 'Customer'
        },
        {
          'SemanticObject': 'Document'
        },
        {
          'SemanticObject': 'TaxReport'
        },
        {
          'SemanticObject': 'VisitList'
        },
        {
          'SemanticObject': 'WBSElement'
        }
      ]);

      test.done();
      Model.releaseModel(theModel);
    });
  });
};



exports.testQueryWithAux = function (test) {
  getModel().then((theModel) => {
    MongoQ.queryWithAuxCategories('orbits', theModel, ['_url']).then((res) => {
      test.deepEqual(res.length, 2);
      debuglog(() => JSON.stringify(res, undefined, 2));
      test.deepEqual(MongoQ.projectResultToArray(res[0]),
        [[null, null],
        [null, 'n/a'],
        ['https://en.wikipedia.org/wiki/Earth', 'Sun'],
        ['https://en.wikipedia.org/wiki/Mars', 'Sun'],
          ['https://en.wikipedia.org/wiki/Proxima_Centauri_b',
            'Alpha Centauri C'],
        ['https://en.wikipedia.org/wiki/Sun', null]]);

      test.deepEqual(res[1].results, []);
      test.done();
      Model.releaseModel(theModel);
    });
  });
};



exports.testQueryWithURI = function (test) {
  getModel().then((theModel) => {
    MongoQ.queryWithURI('orbits', theModel).then((res) => {
      test.deepEqual(res.length, 2);
      debuglog(() => JSON.stringify(res, undefined, 2));
      test.deepEqual(MongoQ.projectResultToArray(res[0]),
        [[null, null],
        [null, 'n/a'],
        ['https://en.wikipedia.org/wiki/Earth', 'Sun'],
        ['https://en.wikipedia.org/wiki/Mars', 'Sun'],
          ['https://en.wikipedia.org/wiki/Proxima_Centauri_b',
            'Alpha Centauri C'],
        ['https://en.wikipedia.org/wiki/Sun', null]]);

      test.deepEqual(res[1].results, []);
      test.done();
      Model.releaseModel(theModel);
    });
  });
};





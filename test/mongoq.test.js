var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var mQ = require(root + '/ast2query/ast2MQuery.js');
var MongoQ = require(root + '/mongoq.js');


var SentenceParser = require(root + '/sentenceparser.js');

var debuglog = require('debug')('mongoq.nunit');
const Model = require('mgnlq_model').Model;


var getModel = require('mgnlq_testmodel_replay').getTestModel;

var words = {};

process.on('unhandledRejection', function (err) {
  console.log('wow, here you go' + err);
  console.log('  ' + err.stack);
});

describe('testMakeMongoDomain', () => {
  let theModel;

  beforeAll(async () => {
    theModel = await getModel();
  });

  afterAll(() => {
    Model.releaseModel(theModel);
  });

  it('testMakeMongoDomain2', async () => {
    var mongoBridge = new MongoQ.MongoBridge(theModel);
    var res = mongoBridge.mongoooseDomainToDomain('FioriBOM');
    expect(res).toEqual('FioriBOM');
  });
  /*
  exports.testMakeMongoDomain = function (test) {
    getModel().then((theModel) => {
      var mongoBridge = new MongoQ.MongoBridge(theModel);
      var res = mongoBridge.mongoooseDomainToDomain('FioriBOM');
      test.equal(res, 'FioriBOM', 'bad result');
      test.done();
      Model.releaseModel(theModel);
    });
  };
  */

  //exports.testMakeMongoDomain = function (test) {
  //  getModel().then((theModel)
  it('testMakeMongoDomain', async () => {
    var res = MongoQ.augmentCategoriesWithURI(['_url', 'orbits'], theModel, 'Cosmos');
    expect(res).toEqual(['_url', 'orbits']);
    res = res = MongoQ.augmentCategoriesWithURI(['orbits'], theModel, 'Cosmos');
    expect(res).toEqual(['_url', 'orbits']); // , 'bad result');
    res = MongoQ.augmentCategoriesWithURI(['orbits', 'abc'], theModel, 'FioriBOM');
    expect(res).toEqual(['uri', 'uri_rank', 'orbits', 'abc']); //  'bad result');
    // test.done();   
  });




  //exports.testMakeQuery = function (test) {
  //  getModel().then((theModel) => {
  it('testMakeMongoDomain', async () => {
    var r = MongoQ.prepareQueries('\'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052',
      theModel, []);
    expect(r.queries).toEqual([{
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
    // test.done();
    // Model.releaseModel(theModel);
  });

  // exports.testMakeQuerySimple = function (test) {
  //   getModel().then((theModel) => {
  it('testMakeQuerySimple', async () => {
    var r = MongoQ.prepareQueries('object name', theModel, []);
    expect(r.queries).toEqual(
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
  });

  // exports.testMakeQueryDoubleConstraint = function (test) {
  //   getModel().then((theModel)
  it('testMakeQueryDoubleConstraint', async () => {
    var r = MongoQ.prepareQueries('AppNAme with AppNAme starting with "Sup" AppNAme containing Obj',
      theModel, []);
    expect(r.queries).toEqual(
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
  });

  //  exports.testMakeQueryStartingWith2 = function (test) {
  //    getModel().then((theModel)

  it('testMakeQueryStartingWith2', async () => {
    var r = MongoQ.prepareQueries('SemanticAction with SemanticAction starting with "Sup"',
      theModel, []);
    expect(r.queries).toEqual(
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
  });



  //exports.testMakeQueryOrderBy = function (test) {

  //getModel().then((theModel)

  it('testMakeQueryOrderBy', async () => {
    //var q0 = 'sender, standort order by gründungsjahr';
    var q1 = 'sender, standort with less than 3 standort order by gründungsjahr';
    var r = MongoQ.prepareQueries(q1,
      theModel, []);
    expect(r.queries).toEqual(
      [{
        domain: 'demomdls',
        collectionName: 'demomdls',
        columns: ['sender', 'standort'],
        auxcolumns: [],
        reverseMap: {},
        query:
          [{
            '$match':
            {
              '$and':
                [
                  {
                    '$expr':
                    {
                      '$lt':
                        [{
                          '$switch':
                          {
                            branches:
                              [{
                                case: { '$isArray': '$standort' },
                                then: { '$size': '$standort' }
                              }],
                            default: 1
                          }
                        },
                        3]
                    }
                  }
                ]
            }
          },
          { '$sort': { 'gründungsjahr': -1, sender: 1, standort: 1 } },
          {
            '$group':
            {
              _id:
              {
                'gründungsjahr': '$gründungsjahr',
                sender: '$sender',
                standort: '$standort'
              },
              'gründungsjahr': { '$first': '$gründungsjahr' },
              sender: { '$first': '$sender' },
              standort: { '$first': '$standort' }
            }
          },
          { '$project': { _id: 0, 'gründungsjahr': 1, sender: 1, standort: 1 } },
          { '$sort': { 'gründungsjahr': -1, sender: 1, standort: 1 } },
          { '$project': { _id: 0, sender: 1, standort: 1 } }]
      },
      undefined]
    );
  });


  //exports.testMakeQueryStartingWith = function (test) {
  //  getModel().then((theModel)

  it('testMakeQueryStartingWith', async () => {
    var r = MongoQ.prepareQueries('SemanticAction starting with "Sup"',
      theModel, []);
    expect(r.queries).toEqual(
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
  });


  // exports.testMakeQueryContaining = function (test) {
  //  getModel().then((theModel)

  it('testMakeQueryContaining', async () => {
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
    expect(r.queries[0]).toEqual(expected[0]);
    expect(r.queries[2]).toEqual(expected[2]);
    expect(r.queries).toEqual(
      expected
    );
  });

  //exports.testMakeQueryContainsFact = function (test) {
  //getModel().then((theModel)

  it('testMakeQueryContainsFact', async () => {
    var r = MongoQ.prepareQueries('element names for element name containing rium 10',
      theModel, []);
    expect(r.queries).toEqual(
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
      undefined,
      undefined,
      undefined,
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
      },
      undefined,
      undefined]
    );
  });

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
          [{
            domain: 'Cosmos',
            aux:
            {
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
            errors: false,
            columns: ['object name'],
            auxcolumns: [],
            results: [{ 'object name': 'abc' }]
          },
          {
            domain: 'metamodel',
            aux:
            {
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
                    bitindex: 32,
                    bitSentenceAnd: 32,
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
            errors:
            {
              err_code: undefined,
              text: 'Error: EarlyExitException: expecting at least one iteration which starts with one of these possible Token sequences::\n  <[Comma] ,[and] ,[CAT]> but found: \'FACT\''
            },
            columns: [],
            auxcolumns: [],
            results: []
          }];
        test.deepEqual(res[0].aux, expected[0].aux, 'first aux ok' + JSON.stringify(res));
        test.deepEqual(res[1], expected[1], '2nd ok');
        test.deepEqual(res[0], expected[0], 'first ok \n ' + JSON.stringify(res));

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

  exports.testCustomStringif = function (test) {
    var a = { a: /abc/i };
    var r = MongoQ.JSONStringify(a);
    test.deepEqual(r, '{\n  "a": "/abc/i"\n}');
    test.done();
  };


  exports.testGetDomainForSentenceSafe = function (test) {
    getModel().then((theModel) => {
      var domain = MongoQ.getDomainForSentenceSafe(theModel, []);
      test.deepEqual(domain, undefined);
      test.done();
      Model.releaseModel(theModel);
    });
  };

  // exports.testGetDomainsForSentence = function (test) {
  //   getModel().then((theModel) 
  it('testGetDomainsForSentence', async () => {
    var s = 'SemanticObject';
    expect.assertions(4);
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var domain = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0]);
    expect(domain).toEqual({ domain: 'FioriBOM', collectionName: 'fioriapps', modelName: 'fioriapps' }, ' got domain');
    var domain2 = MongoQ.getDomainInfoForSentence(theModel, r.sentences[1]);
    expect(domain2).toEqual({
      domain: 'Fiori Backend Catalogs',
      collectionName: 'fioribecatalogs',
      modelName: 'fioribecatalogs'
    }); // , ' got domain');
    return MongoQ.query('SemanticObject', theModel).then((res) => {
      expect(MongoQ.projectResultToArray(res[0])).toEqual(
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

      expect(res[1].results).toEqual([
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
    });
  });

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


  it('testQueryWithURI2', async () => {
    expect.assertions(3);
    return MongoQ.queryWithURI('orbits', theModel).then((res) => {
      expect(res.length).toEqual(2);
      debuglog(() => JSON.stringify(res, undefined, 2));
      expect(MongoQ.projectResultToArray(res[0])).toEqual(
        [[null, null],
          [null, 'n/a'],
          ['https://en.wikipedia.org/wiki/Earth', 'Sun'],
          ['https://en.wikipedia.org/wiki/Mars', 'Sun'],
          ['https://en.wikipedia.org/wiki/Proxima_Centauri_b',
            'Alpha Centauri C'],
          ['https://en.wikipedia.org/wiki/Sun', null]]);
      expect(res[1].results).toEqual([]);
    });
  });

  it('testQueryWithURI', async () => {
    var res = await MongoQ.queryWithURI('orbits', theModel); // .then((res) => {
    expect(res.length).toEqual(2);
    debuglog(() => JSON.stringify(res, undefined, 2));
    expect(MongoQ.projectResultToArray(res[0])).toEqual(
      [[null, null],
        [null, 'n/a'],
        ['https://en.wikipedia.org/wiki/Earth', 'Sun'],
        ['https://en.wikipedia.org/wiki/Mars', 'Sun'],
        ['https://en.wikipedia.org/wiki/Proxima_Centauri_b',
          'Alpha Centauri C'],
        ['https://en.wikipedia.org/wiki/Sun', null]]);

    expect(res[1].results).toEqual([]);

  });

});


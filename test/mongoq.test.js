var process = require('process');
//const { JsxEmit } = require('typescript');
var root = (process.env.FSD_COVERAGE) ? '../js_cov' : '../js';
var mQ = require(root + '/ast2query/ast2MQuery.js');
var MongoQ = require(root + '/mongoq.js');

var SentenceParser = require(root + '/sentenceparser.js');

var debuglog = require('debug')('mongoq.nunit');
const Model = require('mgnlq_model').Model;

//var getModel = require('mgnlq_testmodel_replay').getTestModel;
var getModel = require('mgnlq_testmodel2').getTestModel1;

var words = {};

jest.setTimeout(600000);

process.on('unhandledRejection', function (err) {
  console.log('wow, here you go' + err);
  console.log('  ' + err.stack);
});

describe('testMakeMongoDomain', () => {
  let theModel;

  beforeAll(async () => {
    console.log('before all getModel');
    theModel = await getModel();
    console.log('got beforeAll model');
  });

  afterAll(() => {
    console.log('releasing model post');
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
  it('testTablesInDomainn', (done) => {
    var r = MongoQ.prepareQueries('Tables in Domain IUPAC',
      theModel, []);
    expect(r.queries).toEqual( [undefined, undefined, undefined ]); 
    done();
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
          { '$sort': { 'gr_ndungsjahr': -1, sender: 1, standort: 1 } },
          {
            '$group':
            {
              _id:
              {
                'gr_ndungsjahr': '$gr_ndungsjahr',
                sender: '$sender',
                standort: '$standort'
              },
              'gr_ndungsjahr': { '$first': '$gr_ndungsjahr' },
              sender: { '$first': '$sender' },
              standort: { '$first': '$standort' }
            }
          },
          { '$project': { _id: 0, 'gr_ndungsjahr': 1, sender: 1, standort: 1 } },
          { '$sort': { 'gr_ndungsjahr': -1, sender: 1, standort: 1 } },
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
          [{ '$match': { element_name: { '$regex': /rium/i }, element_number: 10 } },
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
                  { element_number: 10 }]
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
  
  // exports.testGetDomainsForSentence = function (test) {
  //   getModel().then((theModel) 
  it('testGetDomainsForSentence',  (done) => {
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
      done();
    });
  });
});

//////// explicit model instantiation 

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

it('testQueryInternal', done => {
  jest.setTimeout(200000);
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
      expect(res[0].aux).toEqual(expected[0].aux);
      expect(res[1]).toEqual(expected[1]);
      expect(res[0]).toEqual(expected[0]);

      expect(res).toEqual(expected);
      Model.releaseModel(theModel);
      done();
    });
  });
});

it('testMakeQuery2', done => {
  getModel().then((theModel) => {
    var s = 'SemanticObject, SemanticAction, BSPName, ApplicationComponent with ApplicaitonComponent CO-FIO,  appId W0052,SAP_TC_FIN_CO_COMMON';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var node = r.asts[0];
    var nodeFieldList = node.children[0].children[0];
    var nodeFilter = node.children[1];
    var domainPick = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0]);
    var mongoMap = theModel.mongoHandle.mongoMaps[domainPick.modelName];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, r.sentences[0], mongoMap, domainPick.collectionName, theModel.mongoHandle);
    var categoryList = mQ.getCategoryList([], nodeFieldList, r.sentences[0]);
    expect(match).toEqual(
      { $match: { ApplicationComponent: 'CO-FIO', appId: 'W0052', 'TechnicalCatalog': 'SAP_TC_FIN_CO_COMMON' } }
    );
    var proj = mQ.makeMongoProjectionFromAst(categoryList, mongoMap);
    expect(proj).toEqual(
      { $project: { _id: 0, SemanticObject: 1, SemanticAction: 1, BSPName: 1, ApplicationComponent: 1 } }
    );
    var sort = mQ.makeMongoSortFromAst(categoryList, mongoMap);
    expect(sort).toEqual(
      { $sort: { SemanticObject: 1, SemanticAction: 1, BSPName: 1, ApplicationComponent: 1 } }
    );
    var group = mQ.makeMongoGroupFromAst(categoryList, mongoMap);
    expect(group).toEqual({
      $group: {
        _id: { SemanticObject: '$SemanticObject', SemanticAction: '$SemanticAction', BSPName: '$BSPName', ApplicationComponent: '$ApplicationComponent' },
        SemanticObject: { $first: '$SemanticObject' }, SemanticAction: { $first: '$SemanticAction' }, BSPName: { $first: '$BSPName' }, ApplicationComponent: { $first: '$ApplicationComponent' }
      }
    });
    // console.log(JSON.stringify(r)); // how to get domain?
    var domain = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0], mongoMap);
    expect(domain).toEqual(
      { collectionName: 'fioriapps', domain: 'FioriBOM', modelName: 'fioriapps' }
    );
    var query = [match, group, proj];
    debuglog(() => query);
    Model.releaseModel(theModel);
    done();
  });
});


it('testCategoriesInBOM', done => {
  getModel().then((theModel) => {
    var s = 'categories in  Fiori BOM';
    var r = MongoQ.prepareQueries(s, theModel, []);
    debuglog(() => JSON.stringify(r, undefined, 2));
    var query0 = r.queries[0];
    expect(r.queries.length).toEqual(2);
    expect(r.queries.filter(q => !!q).length).toEqual(1);
    expect(query0.query).toEqual([{ '$match': { domain: 'FioriBOM' } },
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
      { '$sort': { category: 1 } }]);
    expect(query0.columns).toEqual(['category']);
    expect(query0.reverseMap).toEqual({});
    Model.releaseModel(theModel);
    done();
  });
});



it('testPrepareQuery2', done => {
  getModel().then((theModel) => {
    var s = 'categories starting with elem';
    var r = MongoQ.prepareQueries(s, theModel, []);
    var query0 = r.queries[0];

    expect(query0.query).toEqual([
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
    expect(query0.columns).toEqual(['category']);
    expect(query0.reverseMap).toEqual({});
    Model.releaseModel(theModel);
    done();
  });
});

it('testGetDomainsForSentence2', done => {
  getModel().then((theModel) => {
    var s = 'SemanticObject';
    var r = SentenceParser.parseSentenceToAsts(s, theModel, words);
    var domain = MongoQ.getDomainInfoForSentence(theModel, r.sentences[0]);
    expect(domain).toEqual(
      { domain: 'FioriBOM', collectionName: 'fioriapps', modelName: 'fioriapps' }
    );
    var domain2 = MongoQ.getDomainInfoForSentence(theModel, r.sentences[1]);
    expect(domain2).toEqual({
      domain: 'Fiori Backend Catalogs',
      collectionName: 'fioribecatalogs',
      modelName: 'fioribecatalogs'
    });
    Model.releaseModel(theModel);
    done();
  });
});


it('testContainsFixedCategories', done => {
  getModel().then((theModel) => {
    expect(MongoQ.containsFixedCategories(theModel, 'Cosmos', [])).toEqual(true);
    expect(MongoQ.containsFixedCategories(theModel, 'Cosmos', ['nocat'])).toEqual(false);
    expect(MongoQ.containsFixedCategories(theModel, 'Cosmos', ['orbits'])).toEqual(true);
    expect(MongoQ.containsFixedCategories(theModel, 'Cosmos', ['orbits', 'nocat'])).toEqual(false);
    expect(MongoQ.containsFixedCategories(theModel, 'FioriBOM', ['uri', 'uri_rank'])).toEqual(true);
    Model.releaseModel(theModel);
    done();
  });
});

it('testCustomStringif', done => {
  var a = { a: /abc/i };
  var r = MongoQ.JSONStringify(a);
  expect(r).toEqual('{\n  "a": "/abc/i"\n}');
  done();
});


it('testGetDomainForSentenceSafe', done => {
  getModel().then((theModel) => {
    var domain = MongoQ.getDomainForSentenceSafe(theModel, []);
    expect(domain).toEqual(undefined);
    Model.releaseModel(theModel);
    done();
  });
});


it('testQueryWithAux', done => {
  getModel().then((theModel) => {
    MongoQ.queryWithAuxCategories('orbits', theModel, ['_url']).then((res) => {
      expect(res.length).toEqual(2);
      debuglog(() => JSON.stringify(res, undefined, 2));
      expect(MongoQ.projectResultToArray(res[0])).toEqual([[null, null],
        [null, 'n/a'],
        ['https://en.wikipedia.org/wiki/Earth', 'Sun'],
        ['https://en.wikipedia.org/wiki/Mars', 'Sun'],
        ['https://en.wikipedia.org/wiki/Proxima_Centauri_b',
          'Alpha Centauri C'],
        ['https://en.wikipedia.org/wiki/Sun', null]]);

      expect(res[1].results).toEqual([]);
      Model.releaseModel(theModel);
      done();
    });
  });
});


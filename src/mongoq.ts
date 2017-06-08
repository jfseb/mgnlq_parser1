'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance

import { ErBase as ErBase, Sentence as Sentence, IFErBase as IFErBase } from 'mgnlq_er';
import { IFModel as IFModel , Model as Model} from 'mgnlq_model';

import * as debug from 'debugf';

const debuglog = debug('mongoq');

import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT} from './ast';

  var createToken = chevrotain.createToken;
  var Lexer = chevrotain.Lexer;
  var Parser = chevrotain.Parser;





import * as mongoose from 'mongoose';

import * as process from 'process';

process.on(

    "unhandledRejection",

    function handleWarning( reason, promise ) {



        console.log(  "[PROCESS] Unhandled Promise Rejection" );

        console.log(  "- - - - - - - - - - - - - - - - - - -"  );

        console.log( reason );

        console.log('' );



    }

);

export function makeMongoName(s : string) : string {
  return s.replace(/[^a-zA-Z0-9]/g,'_');
}

var mongodb = process.env.ABOT_MONGODB || "testmodel";


 (<any>mongoose).Promise = global.Promise;

var db = mongoose.connection;

export class MongoBridge {
  _model : IFModel.IModels;
  constructor(model : IFModel.IModels) {
    this._model = model;
  }
  mongoooseDomainToDomain(mgdomain: string) : string {
    var domain= undefined;
    debug('searching for .............## ' + mgdomain);
    this._model.domains.every(d => {
     // console.log("here we go "  + mgdomain + " " + makeMongoName(d));
      debug("here we go "  + mgdomain + " " + makeMongoName(d));
      if(makeMongoName(d) === makeMongoName(mgdomain)) {
        domain = d;
        debug('got one ' + d);
        return false;
      }
      return true;
    });

    return domain;
  }

  makeSchema(mgdomain : string)  : mongoose.Schema {
    debug('makeSchema for ' + mgdomain);
   // console.log('makeschema ' + mgdomain);
    var domain = this.mongoooseDomainToDomain(mgdomain);
    debuglog(()=> ' domain ' + domain);
    debuglog(()=> ` all domains ` + this._model.domains.join("; "));
    var cats = Model.getCategoriesForDomain(this._model, domain);
    var res = {};
    cats.forEach(cat => {
      res[makeMongoName(cat)] = { type : String};
    })
    return new mongoose.Schema(res);
  }
}



/*
export var talking = new Promise(function(resolve, reject) {
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    // we're connected!
    debug('here model names : ' + db.modelNames());
    resolve();
    debug('now model names : ' + db.modelNames());
    debug('done');
  });
});

talking.catch((err) => {
  console.log(err);
});
*/

export class ModelHandle {
  _theModel : IFModel.IModels;
  _mgBridge : MongoBridge;
  _mongoose : mongoose.Mongoose;
  constructor(theModel: IFModel.IModels) {
    this._theModel = theModel;
    this._mongoose = this._theModel.mongoHandle && this._theModel.mongoHandle.mongoose;
    this._mgBridge = new MongoBridge(theModel);
  }
  query(domain : string, query : any) : Promise<any> {
    var that = this;
    var mgmodelname = Model.getMongooseModelNameForDomain(this._theModel,domain);4
    debuglog('query ' + domain + ' >>' + JSON.stringify(query, undefined, 2));
    return getDBConnection(this._mongoose).then((mongoose) =>{

      return new Promise(function(resolve, reject) {
       Promise.resolve(1).then(() => {
          debuglog('constructing model for ' + mgmodelname);
          if(that._theModel.mongoHandle.mongoose.modelNames().indexOf(mgmodelname) < 0) {
            throw new Error(` ${domain} / ${mgmodelname} is not a present model `);
          }
          var model = that._theModel.mongoHandle.mongoose.model(mgmodelname);
          //
          // console.log('try1');
          //  that._models[mgdomain] = mongoose.model(mgdomain);
          //  console.log('try2');
          //  that._schemas[mgdomain] = mongoose.model(mgdomain).schema;
  //}
        /*
          if(!that._models[mgdomain]) {
            that._schemas[mgdomain] = that._mgBridge.makeSchema(mgdomain);
            that._mongoose.modelNames();
            that._models[mgdomain] = mongoose.model(mgdomain,that._schemas[mgdomain]);
          }
         */
        //  console.log('running stuff')
      // db.fioriboms.aggregate([ { $match : {}}, { $group: { _id : { a : '$BSPName', b : '$AppKey' } , BSPName : { $first : '$BSPName'} , AppKey : { $first : '$AppKey' }}},{ $project: { _id : 0, BSPName : 1 }}], { cursor : {  batchSize : 0}});
            //var model = that._models[mgdomain];
          //  console.log('here model ' + model);
          //  model.collection.count({}, function(err,number) {
            //  console.log("counted " + number + " members in collection");
          //  });
        //   console.log(JSON.stringify(query, undefined,2));
          /*  model.collection.count({}, function(a) {
              debuglog('lets count' + a); });
            */
            debuglog(()=>'here model ' + Object.keys(model));
            var resq = model.aggregate(query).then( (res) => {
          //   console.log("here the result" + JSON.stringify(res));
              resolve(res);
              //db.close();
            }).catch((err) => {
              console.error(err);
              db.close();
            });
          });
      });
    })
  }
}

function incHash(hsh, key) {
  hsh[key] = (hsh[key] || 0) + 1;
}

/**
 * given a Sentence, obtain the domain for it
 * @param theModel
 * @param sentence
 */
export function getDomainForSentence(theModel: IFModel.IModels, sentence : IFErBase.ISentence) : {
  domain : string,
  collectionName : string
}
{
  // this is sloppy and bad
  var res = {};
  var o = 0xFFFFFFF;
  sentence.forEach(w => {
    if (w.rule.wordType === IFModel.WORDTYPE.CATEGORY ) {
      o = o & w.rule.bitSentenceAnd;
      Model.getDomainsForCategory(theModel,w.matchedString).forEach(d =>{
        incHash(res,d);
      });
    }
    if (w.rule.wordType === IFModel.WORDTYPE.FACT) {
      o = o & w.rule.bitSentenceAnd;
    //   console.log(`${w.rule.bitindex} ${w.bitindex} ${w.rule.bitSentenceAnd} ${o} `);
       Model.getDomainsForCategory(theModel,w.category).forEach(d =>{
        incHash(res,d);
      });
    }
  });
  var domains = Model.getDomainsForBitField(theModel,o);
  if(domains.length !== 1) {
    throw new Error('more than one domain: "' + domains.join('", "') + '"');
  }
  if(!domains[0]) {
    console.log('query without a domain : ' + Sentence.dumpNiceArr([sentence]));
  }
  return {
    domain : domains[0],
    collectionName : makeMongoName(domains[0])
  }
};

import { IFErBase as IMatch, ErError as ErError } from 'mgnlq_er';

import * as mQ from './ast2MQuery';

export interface SRes {
  sentence :  IFErBase.ISentence,
  records : any[]
};

export interface QResult {
  sentence :  IFErBase.ISentence,
  columns : string[],
  results : string[][]
};


export function fuseAndOrderResults(res : SRes[]) : IFErBase.IWhatIsTupelAnswer[] {
  var all = [];
  debug(JSON.stringify(res));
  res.forEach(res1 => {
    res1.records.forEach(rec => {
      var r2 = undefined as IFErBase.IWhatIsTupelAnswer;
      r2 = {
        record : rec,
        sentence : res1.sentence,
        categories: Object.keys(rec),
        result: Object.keys(rec).map(key => rec[key]),
        _ranking : 1
      };
      all.push(r2);
    })
  }
  );
  return all;
}
  /*
 sentence: ISentence;
    record: IRecord;
    categories: string[];
    result: string[];
    _ranking: number;
  */
var mongoConnPromise = undefined as Promise<mongoose.Connection>;

function getDBConnection(mongooseHndl : mongoose.Mongoose) : Promise<mongoose.Connection> {
  if(mongooseHndl ){
    debuglog('assuming present handle');
    // we assume we are connected
    return Promise.resolve(mongooseHndl.connection);
  }
  if(!mongoConnPromise) {
     mongoConnPromise =  new Promise(function(resolve, reject) {
      mongoose.connect('mongodb://localhost/' + mongodb).then(() => {
        resolve(mongoose.connection);
      });
    });
  }
  return mongoConnPromise;
}

import * as SentenceParser from './sentenceparser';

export interface IQuery  {
  domain : string,
  columns : string[],
  reverseMap : IReverseMap,
  query : any
};

export interface IPreparedQuery extends SentenceParser.IParsedSentences {
  queries : IQuery[]
};

export function prepareQueries(query : string, theModel: IFModel.IModels) : IPreparedQuery {
  debuglog(`here query: ${query}`);
  var r = SentenceParser.parseSentenceToAsts(query,theModel,{}); // words);
  var res = Object.assign({}, r) as IPreparedQuery ;
  r.domains = [];
  res.queries = res.asts.map( (astnode,index) => {
    var sentence = r.sentences[index];
    debuglog(() => `return  ast [${index}]:` + AST.astToText(astnode));
    if (!astnode) {
      debuglog(() => JSON.stringify(` empty node for ${index} ` + JSON.stringify(r.errors[index],undefined,2) ) );
      return undefined;
    }
    var nodeFieldList = astnode.children[0].children[0];
    var nodeFilter = astnode.children[1];
    var match = mQ.makeMongoMatchFromAst(nodeFilter, sentence, theModel);
    var proj = mQ.makeMongoProjectionFromAst(nodeFieldList, sentence, theModel);
    var columnsReverseMap= mQ.makeMongoColumnsFromAst(nodeFieldList, sentence,theModel);
    var group = mQ.makeMongoGroupFromAst(nodeFieldList, sentence, theModel);
    //   console.log(' query: ' + JSON.stringify(r)); // how to get domain?
    var domainPick = getDomainForSentence(theModel, sentence);
    r.domains[index] = domainPick.domain;
   // test.equal(domain, 'FioriBOM',' got domain');
    var query = [ match, group, proj ];
    debuglog(` mongo query for collection ${domainPick.collectionName} : ` + JSON.stringify(query, undefined, 2));
    return {
      domain : domainPick.domain,
      collectionName : domainPick.collectionName,
      columns: columnsReverseMap.columns,
      reverseMap : columnsReverseMap.reverseMap,
      query : query
    };
  });
  return res;
}

export interface IProcessedMongoAnswers extends IMatch.IProcessedSentences {
  queryresults : QResult[]
}


export function mergeResults(r : QResult[]) {
  return r;
}

export function query(query : string, theModel : IFModel.IModels) : Promise<IProcessedMongoAnswers> {
  var handle = new ModelHandle(theModel);
  return queryInternal(query, theModel , handle);
}

export type IReverseMap = { [key : string] : string};

export function remapRecord(rec,  columns: string[], reverseMap : IReverseMap) : string[] {
  var r = {};
  Object.keys(rec).forEach(key => {
    var targetKey = reverseMap[key] || key;
    r[targetKey] = rec[key];
  });
  return columns.map(c => r[c]);
};


export function remapResult(res, columns: string[], reverseMap : IReverseMap)  : string[][] {
  return res.map(record => remapRecord(record, columns, reverseMap)
  );
}

export function queryInternal(querystring : string, theModel : IFModel.IModels, handle: ModelHandle ) :
  Promise<IProcessedMongoAnswers> {
    var r =  prepareQueries(querystring, theModel);
    var aPromises = r.queries.map( (query, index)  => {
      debuglog(() => `query ${index} prepared for domain ` + (query && query.domain));
      if(query === undefined) {
        return  {
           sentence : r.sentences[index],
           columns : [],
           results : []
        } as QResult
      }
      return handle.query(query.domain, query.query).then( res => {
        //console.log('db returned' + res);
        var resClean = remapResult(res, r.queries[index].columns, query.reverseMap);
        return  {
           sentence : r.sentences[index],
           columns : r.queries[index].columns,
           results : resClean
        } as QResult
      }
    )
    }
    );
    var u = Promise.all<QResult>(aPromises);
       var k = u.then<IProcessedMongoAnswers>( aRes => {
      //   console.log("***here results of all queries " + JSON.stringify(aRes, undefined, 2));
          var queryresults = mergeResults(aRes);
          var res2 = {
            queryresults : queryresults,
            errors : r.errors, // [ErError.makeError_EMPTY_INPUT()] ,
            tokens : r.tokens,
          } as IProcessedMongoAnswers;
       return res2;
    }
  );
  return k;
}

/*



          export interface IWhatIsTupelAnswer {
              sentence: ISentence;
              record: IRecord;
              categories: string[];
              result: string[];
              _ranking: number;
          }





      });
    }
  //  logPerf('listAllWithContext');
  //  perflog("totalListAllWithContext");
    var aSentencesReinforced = analyzeContextString(contextQueryString, aRules);
  //  perflog("LATWC matching records (s=" + aSentencesReinforced.sentences.length + ")...");
    var matchedAnswers = WhatIs.matchRecordsQuickMultipleCategories(aSentencesReinforced, categories, records, domainCategoryFilter); //aTool: Array<IMatch.ITool>): any /* objectstream * / {
    if(debuglog.enabled){
      debuglog(" matched Answers" + JSON.stringify(matchedAnswers, undefined, 2));
    }
  //  perflog("filtering topRanked (a=" + matchedAnswers.tupelanswers.length + ")...");
 //   var matchedFiltered = WhatIs.filterOnlyTopRankedTupel(matchedAnswers.tupelanswers);
 //   if (debuglog.enabled) {
 //     debuglog("LATWC matched top-ranked Answers" + JSON.stringify(matchedFiltered, undefined, 2));
 //   }
  }
}
*/
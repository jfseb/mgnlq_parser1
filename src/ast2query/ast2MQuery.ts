'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance

import * as mongoose from 'mongoose';
//import * as m2s from './model2schema.js';

import { Sentence as Sentence, IFErBase as IFErBase } from '../match/er_index';

import * as debug from 'debugf';
import * as _ from 'lodash';

//import * as Model from 'mgnlq_model';
import { IFModel as IFModel, MongoMap, Model as Model } from 'mgnlq_model';

const debuglog = debug('ast2MQuery');

import * as chevrotain from 'chevrotain';
import * as AST from '../ast';

import { ASTNodeType as NT } from '../ast';
import { IMongooseBaseType } from 'mgnlq_model/js/match/ifmatch';

// import * as Sentenceparser from '../sentenceparser';

var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

export interface IFilter {
  cat: string,
  value: string
};

/* construct a mongo query from an AST */

export function makeMongoDistinctGroup(cols: string[]): any {
  var res = { $group: { _id: {} } };
  cols.forEach(col => {
    res.$group[col] = '$' + col;
    res.$group._id[col] = '$' + col;
  });
  return res;
}

export function getCategoryForNodePair(nodeCat: AST.ASTNode, nodeFact: AST.ASTNode, sentence: IFErBase.ISentence) {

  //  either           <CAT> <FACT>
  //  or               undefined <FACT>
  //  or  More than    <number> <CAT>
  if (nodeCat && nodeCat.bearer && nodeCat.bearer.image === 'NUMBER') {
    return getCategoryForNodePair(nodeFact, nodeFact, sentence);
  }
  var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
  debug('StartIndex : ' + startIndex);
  debug('StartIndex : ' + JSON.stringify(nodeCat, undefined, 2));
  if (typeof startIndex === "number" && (startIndex >= 0)) {
    return sentence[startIndex].matchedString;
  }
  if (!nodeCat || nodeCat.children.length === 0 || nodeCat.bearer === undefined) {
    var factIndex = nodeFact.bearer.startOffset;
    debug(JSON.stringify(sentence[factIndex], undefined, 2));
    return sentence[factIndex].category;
  }
  debug(' found no category ');
  return undefined;
};

export function getCategoryForNode(nodeCat: AST.ASTNode, sentence: IFErBase.ISentence) {
  var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
  if (nodeCat.type !== NT.CAT) {
    throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(nodeCat.type).toString()}`);
  }
  if (startIndex !== undefined && (startIndex >= 0)) {
    return sentence[startIndex].matchedString;
  }
  throw new Error(' no startindex' + JSON.stringify(nodeCat));
};

export function getFactForNode(nodeFact: AST.ASTNode, sentence: IFErBase.ISentence) {
  var factIndex = nodeFact.bearer.startOffset;
  //console.log(JSON.stringify(sentence[factIndex], undefined, 2));
  return sentence[factIndex].matchedString; //.category;
};

export function makeMongoName(s: string): string {
  return MongoMap.makeMongoNameLC(s);
  //return s.replace(/[^a-zA-Z0-9]/g,'_');
}

function makeFilterObj(cat, filter) {
  var filterObj = {};
  filterObj[cat] = filter;
  return filterObj;
}

export function addFilterToMatch(res, cat, filter) {
  if (res['$and']) {
    res['$and'].push(makeFilterObj(cat, filter));
    return res;
  }
  if (res[cat]) {
    var filters = Object.keys(res).sort().map(key => makeFilterObj(key, res[key]));
    filters.push(makeFilterObj(cat, filter));
    return { $and: filters };
  }
  res[cat] = filter;
  return res;
};

export function addFilterExpr(res, expr: any) {
  if (res['$and']) {
    res['$and'].push(expr);
    return res;
  }
  res['$and'] = [expr];
  return res;
};

export function addObjectProp(src, key: string, value: any): any {
  src[key] = value;
  return src;
}

export function addSortExpression(res, expr: any) {
  if (res['$sort']) {
    _.merge(res['$sort'], expr);
    return res;
  }
  res['$sort'] = expr;
  return res;
}

export function getNumberArg(node: AST.ASTNode, sentence: IFErBase.ISentence): number { // !! returns a number 
  var startIndex = node && node.bearer && node.bearer.startOffset;
  if (node.type !== NT.NUMBER) {
    throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(node.type).toString()}`);
  }
  if (startIndex !== undefined && (startIndex >= 0)) {
    //TODO treat one, two
    return parseInt(sentence[startIndex].matchedString);
  }
  throw new Error(' no startindex' + JSON.stringify(node));
};


export function isArray(mongoHandleRaw: IFModel.IModelHandleRaw, domain: string, category: string) {
  var cat = Model.getCategoryRec(mongoHandleRaw, domain, category);
  return _.isArray(cat.type);
}

export function isNumericTypeOrHasNumericType(mongoHandleRaw: IFModel.IModelHandleRaw, domain: string, category: string) {
  var cat = Model.getCategoryRec(mongoHandleRaw, domain, category);
  console.log("category " + category + "  -> " + JSON.stringify(cat));
  return (cat.type == IMongooseBaseType.Number) || (_.isArray(cat.type) && cat.type.indexOf(IMongooseBaseType.Number) >= 0)
}

export function coerceFactLiteralToType(isNumeric: boolean, fact: string): number | string {
  if (isNumeric) {
    try {
      var r = parseInt(fact);
      if (Number.isNaN(r)) {
        return fact;
      }
      return r;
    } catch (e) { }
  }
  return fact;
}

export function amendCategoryList(extractSortResult: any[], catList: string[]): string[] {
  var res = [];
  extractSortResult.forEach(a => {
    var name = a.categoryName;
    if (!catList.includes(name)) {
      res.push(name);
    }
  });
  res = res.concat(catList);
  return res;
}

export function makeMongoMatchFromAst(node: AST.ASTNode, sentence: IFErBase.ISentence, mongoMap: IFModel.CatMongoMap, domain: string, mongoHandleRaw: IFModel.IModelHandleRaw) {
  debug(AST.astToText(node));
  //console.log("making mongo match " + AST.astToText(node));
  if (!node) {
    return { $match: {} };
  }
  if (node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type);
  }
  var res = {};
  node.children.forEach(n => {
    var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
    //console.log('here is the domain ' + mongodomain);
    //console.log('here is the domain ' + Object.keys(theModel.mongoHandle.mongoMaps).join("\n"));

    //console.log(JSON.stringify(theModel.mongoHandle.mongoMaps[mongodomain], undefined,2));
    var mongocatfullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
    debuglog(() => `here is the fullpath for ${category} is ${mongocatfullpath} `);
    var fact = (n.children.length > 1) && getFactForNode(n.children[1], sentence);
    var catIsNumeric = isNumericTypeOrHasNumericType(mongoHandleRaw, domain, category);
    var factCoerced = coerceFactLiteralToType(catIsNumeric, fact);
    if (n.type === NT.OPEqIn) {
      res = addFilterToMatch(res, mongocatfullpath, factCoerced);
    } else if (n.type === NT.OPStartsWith) {
      res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`^${fact.toLowerCase()}`, "i") });
    } else if (n.type === NT.OPEndsWith) {
      debuglog(() => '!!!!adding regex with expression ' + fact.toLowerCase());
      res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`${fact.toLowerCase()}$`, "i") });
    }/* else if (n.type === NT.OPMoreThan) {
      var numberarg = getNumberArg(n.children[0], sentence);
      debuglog(() => '!!!!adding more than ' + numberarg + ' for category ' + category );
      //TODO //res = addFilterToMatch(res, mongocatfullpath, { 'count' ( mongocatfullpath ) gt numberarg , "i") });
      var argpath = '$' + mongocatfullpath;
      res = addFilterExpr( res,
        { $expr: { $gt: [ { $switch: { branches: [ { case: { $isArray : argpath }, then: { $size: argpath } }], default : 1 }}
                        , numberarg ]}} );

//
//        { $expr: { $gt: [ { $size: '$standort'},1 ]}} );
//      ([ { $match : { $expr: { $gt: [ { $size: argpath }, numberarg ]}}}]);
// two stage
// use $addFields  with 3.4
// try also $expr directly
//       > db.demomdls.aggregate([ { $project : { standort_size : { $size: '$standort' }, standort:1, sender:1, uu : { $gt:[ { $size: '$standort' },3]} , abx : { $gt:[ "$standort", 1]}}}, { $match: { "standort_size": { $eq: { $size: '$standort'} }}}]);
//      > db.demomdls.aggregate([ { $project : { standort_size : { $size: '$standort' }, standort:1, sender:1, uu : { $gt:[ { $size: '$standort' },3]} , abx : { $gt:[ "$standort", 1]}}}, { $match: { "standort_size": { $gt: 1 }}}]);
//      { "_id" : ObjectId("5db88a185b66759cfc56bcd4"), "standort" : [ "Berlin", "München", "Frankfurt", "Hamburg", "Bremen" ], "sender" : "ARundfunkD", "standort_size" : 5, "uu" : true, "abx" : true }


    // exact match: db.demomdls.aggregate([ { $match: { standort : { $size : 3 }}},

    }*/
    else if (n.type === NT.OPLessThan || n.type === NT.OPMoreThan || n.type == NT.OPExactly) {
      // flavours: 
      // less_than 3 CAT    ( a count measure )
      var numberarg = getNumberArg(n.children[0], sentence);
      debuglog(() => '!!!!adding more than ' + numberarg + ' for category ' + category);
      //TODO //res = addFilterToMatch(res, mongocatfullpath, { 'count' ( mongocatfullpath ) gt numberarg , "i") });
      var argpath = '$' + mongocatfullpath;
      var extract = [{ $switch: { branches: [{ case: { $isArray: argpath }, then: { $size: argpath } }], default: 1 } }
        , numberarg];
      switch (n.type) {
        case NT.OPLessThan: res = addFilterExpr(res, { $expr: { $lt: extract } }); break;
        case NT.OPMoreThan: res = addFilterExpr(res, { $expr: { $gt: extract } }); break;
        case NT.OPExactly: res = addFilterExpr(res, { $expr: { $eq: extract } }); break;
      }
    }
    else if (n.type === NT.OPContains) {
      res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`${fact.toLowerCase()}`, "i") });
    }
    else if (n.type === NT.OPGT || n.type === NT.OPLT
      || n.type == NT.OPEQ || n.type == NT.OPNE
      || n.type == NT.OPGE || n.type == NT.OPLE) {
      var fact = getFactForNode(n.children[1], sentence);
      var factCoerced = coerceFactLiteralToType(catIsNumeric, fact);
      var argpath = '$' + mongocatfullpath;
      var extract2 = [argpath, factCoerced];
      // $switch: { branches: [ { case: { $isArray : argpath }, then: { $size: argpath } }], default : 1 }}

      var opstr = '$lt';
      switch (n.type) {
        case NT.OPLT: opstr = '$lt'; break;
        case NT.OPGT: opstr = '$gt'; break;
        case NT.OPEQ: opstr = '$eq'; break;
        case NT.OPNE: opstr = '$ne'; break;
        case NT.OPLE: opstr = '$lte'; break;
        case NT.OPGE: opstr = '$gte'; break;
      }

      if (isArray(mongoHandleRaw, domain, category)) {
        // db.demomdls.aggregate([ { $match: { standort : {  $elemMatch : { '$gte': 'M' }} }  }  ]);
        var filterobj = makeFilterObj(mongocatfullpath, { $elemMatch: makeFilterObj(opstr, factCoerced) });
        res = addFilterExpr(res, filterobj);
      }
      else {
        var filterobj = makeFilterObj(mongocatfullpath, makeFilterObj(opstr, factCoerced));
        res = addFilterExpr(res, filterobj);
      }
      //var numberarg = getNumberArg(n.children[0], sentence);
    }
    else if (n.type === NT.OPOrderBy || n.type === NT.OPOrderDescendingBy) {
      //var ascdesc = (n.type == NT.OPOrderDescendingBy) ? 1 : -1;
      // res = addSortExpression(res, addObjectProp( {}, mongocatfullpath, ascdesc ) );
      // TODO  this may be added in the wrong position
      //  one also has to assure the data is not projected out before
      //   throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
      // { $sort : { sender : -1 } }`
    }
    else if (n.type === NT.OPNotExisting) {
      // { item : null }
      var filterobj = makeFilterObj(mongocatfullpath, null);
      res = addFilterExpr(res, filterobj);
      //  throw new Error('Expected nodetype OPExisiting not supported here  NT.OPEqIn but was ' + n.type);
    }
    else if (n.type === NT.OPExisting) {
      var filterobj = makeFilterObj(mongocatfullpath, { '$exists': true });
      res = addFilterExpr(res, filterobj);
      //  throw new Error('Expected nodetype OPExisiting not supported here  NT.OPEqIn but was ' + n.type);
    }
    else {
      throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
    }
  });
  return { $match: res };
}

export function extractExplicitSortFromAst(node: AST.ASTNode, sentence: IFErBase.ISentence, mongoMap: IFModel.CatMongoMap, domain: string, mongoHandleRaw: IFModel.IModelHandleRaw): ExplicitSort[] {
  // return an array
  debug(AST.astToText(node));
  //console.log("making mongo match " + AST.astToText(node));
  if (!node) {
    return [];
  }
  if (node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type);
  }
  var res = [] as ExplicitSort[];
  node.children.forEach(n => {
    var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
    var mongocatfullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
    var fact = (n.children.length > 1) && getFactForNode(n.children[1], sentence);
    if (n.type === NT.OPOrderBy || n.type === NT.OPOrderDescendingBy) {
      var ascdesc = (n.type == NT.OPOrderDescendingBy) ? 1 : -1;
      res.push({
        categoryName: category,
        mongocatfullpath: mongocatfullpath,
        ascDesc: ascdesc
      } as ExplicitSort);
    }
  });
  return res;
}

export function makeMongoGroupFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap) {
  var res = {};
  categoryList.forEach(category => {
    var mongocatfullpath = MongoMap.getFirstSegment(mongoMap[category].paths); // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
    res[mongocatfullpath] = '$' + mongocatfullpath;
  });
  var r1 = { $group: Object.assign({ _id: Object.assign({}, res) }, {}) };
  var firstX = {};
  Object.keys(res).forEach(key => { firstX[key] = { $first: '$' + key } });
  r1.$group = Object.assign(r1.$group, firstX);
  return r1;
}

export function makeMongoColumnsFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap)
  : { columns: string[], reverseMap: { [key: string]: string } } {
  var res = {
    columns: [],
    reverseMap: {}
  };
  categoryList.forEach(category => {
    res.columns.push(category);
    var catmongo = MongoMap.getShortProjectedName(mongoMap, category);
    if (category !== catmongo) {
      res.reverseMap[catmongo] = category;
    }
  });
  return res;
}

export function getCategoryList(fixedCategories: string[], node: AST.ASTNode, sentence: IFErBase.ISentence): string[] {
  var res = fixedCategories.slice();
  while (node.type !== NT.LIST)
    node = node.children[0];
  debug(AST.astToText(node));
  if (node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type);
  }
  node.children.map(n => {
    if (n.type === NT.CAT) {
      var category = getCategoryForNode(n, sentence);
      if (res.indexOf(category) < fixedCategories.length) {
        res.push(category);
      }
    } else {
      throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
    }
  });
  return res;
}

export function makeMongoProjectionFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap) {
  var res = { _id: 0 };
  categoryList.map(category => {
    var mongocatfullpath = mongoMap[category].fullpath; //makeMongoName(cat);
    var shortName = MongoMap.getShortProjectedName(mongoMap, category);
    if (shortName === mongocatfullpath) {
      res[mongocatfullpath] = 1;
    } else {
      res[shortName] = "$" + mongocatfullpath;
    }
  });
  return { $project: res };
}



export function makeMongoSortFromAst(categoryList: string[], mongoMap: IFModel.CatMongoMap) {
  var res = {};
  categoryList.forEach(category => {
    var shortName = MongoMap.getShortProjectedName(mongoMap, category);
    res[shortName] = 1;
  });
  return { $sort: res };
}

export interface ExplicitSort {
  categoryName: string,
  ascDesc: number,
  mongocatfullpath: string
};

export function makeMongoExplicitSort(explicitSort: ExplicitSort[], categoryList: string[], mongoMap: IFModel.CatMongoMap) {
  var res = {};
  explicitSort.forEach(es => {
    var mongoCatName = es.mongocatfullpath;
    res[mongoCatName] = es.ascDesc;
  });
  categoryList.forEach(category => {
    var shortName = MongoMap.getShortProjectedName(mongoMap, category);
    if (res[shortName] == undefined) {
      res[shortName] = 1;
    }
  });
  return { $sort: res };
}



export function makeMongoMatchF(filters: IFilter[]) {
  var res = { $match: {} };
  //console.log('is match \n');
  filters.forEach(filter => {
    res.$match[filter.cat] = filter.value;
  });
  return res;
}

export function makeMongoProjection(cols: string[]): any {
  var res = { $project: { _id: 0 } };
  cols.forEach(col => {
    res.$project[col] = 1;
  });
  return res;
}

export function makeMongoQuery(filters: IFilter[], resultcolumns: string[]): any {
  var filter = makeMongoMatchF(filters);
  var group = makeMongoDistinctGroup(resultcolumns);
  var projection = makeMongoProjection(resultcolumns);
  return [filter, group, projection];

}



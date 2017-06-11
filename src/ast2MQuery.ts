'use strict'

// based on: http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
// and:  http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance

import * as mongoose from 'mongoose';
//import * as m2s from './model2schema.js';

import { ErBase as ErBase, Sentence as Sentence, IFErBase as IFErBase } from 'mgnlq_er';

import * as debug from 'debugf';

import * as Model from 'mgnlq_model';
import { IFModel as IFModel, MongoMap } from 'mgnlq_model';

const debuglog = debug('ast2MQuery');

import * as chevrotain from 'chevrotain';
import * as AST from './ast';

import { ASTNodeType as NT} from './ast';

import * as Sentenceparser from './sentenceparser';

var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

export interface IFilter {
  cat : string,
  value : string
};

/* construct a mongo query from an AST */

export function makeMongoDistinctGroup(cols : string[]) : any {
  var res = { $group : { _id : {} } };
  cols.forEach(col => {
    res.$group[col] = '$' + col;
    res.$group._id[col]  = '$' + col;
  });
  return res;
}

export function getCategoryForNodePair(nodeCat : AST.ASTNode, nodeFact : AST.ASTNode , sentence: IFErBase.ISentence) {
  var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
  debug('StartIndex : ' + startIndex);
  debug('StartIndex : ' + JSON.stringify(nodeCat,undefined,2));
  if (typeof startIndex === "number" && (startIndex >= 0) ) {
    return sentence[startIndex].matchedString;
  }
  if(!nodeCat || nodeCat.children.length === 0 || nodeCat.bearer === undefined) {
    var factIndex = nodeFact.bearer.startOffset;
    debug(JSON.stringify(sentence[factIndex], undefined, 2));
    return sentence[factIndex].category;
  }
};

export function getCategoryForNode(nodeCat : AST.ASTNode, sentence: IFErBase.ISentence) {
  var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
  if (nodeCat.type !== NT.CAT) {
      throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(nodeCat.type).toString()}`);
  }
  if (startIndex !== undefined && (startIndex >= 0) ) {
    return sentence[startIndex].matchedString;
  }
  throw new Error(' no startindex' + JSON.stringify(nodeCat));
};

export function getFactForNode(nodeFact : AST.ASTNode , sentence: IFErBase.ISentence) {
  var factIndex = nodeFact.bearer.startOffset;
    //console.log(JSON.stringify(sentence[factIndex], undefined, 2));
  return sentence[factIndex].matchedString; //.category;
};

export function makeMongoName(s : string) : string {
  return MongoMap.makeMongoNameLC(s);
  //return s.replace(/[^a-zA-Z0-9]/g,'_');
}

function makeFilterObj(cat,filter) {
    var filterObj = { };
    filterObj[cat] = filter;
    return filterObj;
}

export function addFilterToMatch(res,cat,filter) {
  if(res['$and']) {
    res['$and'].push(makeFilterObj(cat,filter));
    return res;
  }
  if(res[cat]) {
    var filters = Object.keys(res).sort().map(key => makeFilterObj(key,res[key]));
    filters.push(makeFilterObj(cat,filter));
    return { $and : filters };
  }
  res[cat] = filter;
  return res;
};

export function makeMongoMatchFromAst(node : AST.ASTNode, sentence : IFErBase.ISentence, mongoMap:  IFModel.CatMongoMap) {
  debug(AST.astToText(node));
  //console.log("making mongo match " + AST.astToText(node));
  if(!node) {
    return { $match : { }};
  }
  if(node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type );
  }
  var res = {};
  node.children.forEach(n => {
    var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
    //console.log('here is the domain ' + mongodomain);
    //console.log('here is the domain ' + Object.keys(theModel.mongoHandle.mongoMaps).join("\n"));

    //console.log(JSON.stringify(theModel.mongoHandle.mongoMaps[mongodomain], undefined,2));
    var mongocatfullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
    debuglog(()=>`here is the fullpath for ${category} is ${mongocatfullpath} `);
    var fact = getFactForNode(n.children[1], sentence);
    if (n.type === NT.OPEqIn) {
      res = addFilterToMatch(res,mongocatfullpath,fact);
    } else if( n.type === NT.OPStartsWith) {
           res = addFilterToMatch(res,mongocatfullpath, { $regex : new RegExp(`^${fact.toLowerCase()}`,"i") });
    } else if( n.type === NT.OPEndsWith) {
          debuglog(()=>'!!!!adding regex with expression ' + fact.toLowerCase()  );
          res = addFilterToMatch(res,mongocatfullpath,{ $regex : new RegExp(`${fact.toLowerCase()}$`,"i") });
    }
    else if( n.type === NT.OPContains) {
         res = addFilterToMatch(res,mongocatfullpath, { $regex : new RegExp(`${fact.toLowerCase()}`,"i") });
    }
    else {
      throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
    }
  });
  return { $match : res};
}

export function makeMongoGroupFromAst(node : AST.ASTNode, sentence : IFErBase.ISentence, mongoMap:  IFModel.CatMongoMap) {
  debug(AST.astToText(node));
  if(node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type );
  }
  var res = {};
  var categories = node.children.map(n => {
    if (n.type === NT.CAT) {
      var category = getCategoryForNode(n, sentence);
      return category;
    } else {
      throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
    }
  });
  categories.forEach(category => {
      var mongocatfullpath = MongoMap.getFirstSegment(mongoMap[category].paths); // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
      res[mongocatfullpath] = '$' + mongocatfullpath;
  });
  var r1 = { $group: Object.assign({ _id: Object.assign({}, res)}, {}) };
  var firstX = {};
  Object.keys(res).forEach(key => { firstX[key] = { $first: '$' + key }});
  r1.$group = Object.assign(r1.$group,firstX);
  return r1;
}

export function makeMongoColumnsFromAst(node : AST.ASTNode, sentence : IFErBase.ISentence,  mongoMap:  IFModel.CatMongoMap)
: { columns: string[], reverseMap :{ [key: string] : string }} {
  debug(AST.astToText(node));
  if(node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type );
  }
  var res = { columns : [],
              reverseMap : {} };
  node.children.forEach(n => {
    if (n.type === NT.CAT) {
      var category = getCategoryForNode(n, sentence);
      res.columns.push(category);
      var catmongo = MongoMap.getShortProjectedName(mongoMap, category);
      if( category !== catmongo) {
        res.reverseMap[catmongo] = category;
      }
     } else {
      throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
    }
  });
  return res;
}


export function makeMongoProjectionFromAst(node : AST.ASTNode, sentence : IFErBase.ISentence, mongoMap:  IFModel.CatMongoMap) {
  debug(AST.astToText(node));
  if(node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type );
  }
  var res = { _id : 0 };
  node.children.map(n => {
    if (n.type === NT.CAT) {
      var category = getCategoryForNode(n, sentence);
      var mongocatfullpath = mongoMap[category].fullpath; //makeMongoName(cat);
      var shortName = MongoMap.getShortProjectedName(mongoMap, category);
      if(shortName === mongocatfullpath) {
        res[mongocatfullpath] = 1;
      } else {
        res[shortName] = "$" + mongocatfullpath;
      }
     } else {
      throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
    }
  });
  return { $project : res};
}



export function makeMongoSortFromAst(node : AST.ASTNode, sentence : IFErBase.ISentence, mongoMap:  IFModel.CatMongoMap) {
  debug(AST.astToText(node));
  if(node.type !== NT.LIST) {
    throw new Error('expected different nodetype ' + node.type );
  }
  var res = { };
  node.children.map(n => {
    if (n.type === NT.CAT) {
      var category = getCategoryForNode(n, sentence);
      var shortName = MongoMap.getShortProjectedName(mongoMap, category);
      res[shortName] = 1;
     } else {
      throw new Error(`Expected nodetype ${new AST.NodeType(NT.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
    }
  });
  return { $sort : res};
}


export function makeMongoMatchF(filters: IFilter[]) {
  var res = { $match : {}};
  //console.log('is match \n');
  filters.forEach(filter => {
    res.$match[ filter.cat ] = filter.value;
  });
  return res;
}

export function makeMongoProjection(cols : string[]) : any {
  var res = { $project : { _id : 0 } };
  cols.forEach(col => {
    res.$project[col] = 1;
  });
  return res;
}

export function makeMongoQuery(filters : IFilter[], resultcolumns : string[]) : any {
  var filter = makeMongoMatchF(filters);
  var group = makeMongoDistinctGroup(resultcolumns);
  var projection = makeMongoProjection(resultcolumns);
  return [filter,group,projection];

}



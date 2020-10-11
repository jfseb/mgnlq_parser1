'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoQuery = exports.makeMongoProjection = exports.makeMongoMatchF = exports.makeMongoExplicitSort = exports.makeMongoSortFromAst = exports.makeMongoProjectionFromAst = exports.getCategoryList = exports.makeMongoColumnsFromAst = exports.makeMongoGroupFromAst = exports.extractExplicitSortFromAst = exports.makeMongoMatchFromAst = exports.amendCategoryList = exports.isArray = exports.getNumberArg = exports.addSortExpression = exports.addObjectProp = exports.addFilterExpr = exports.addFilterToMatch = exports.makeMongoName = exports.getFactForNode = exports.getCategoryForNode = exports.getCategoryForNodePair = exports.makeMongoDistinctGroup = void 0;
const debug = require("debugf");
const _ = require("lodash");
//import * as Model from 'mgnlq_model';
const mgnlq_model_1 = require("mgnlq_model");
const debuglog = debug('ast2MQuery');
const chevrotain = require("chevrotain");
const AST = require("../ast");
const ast_1 = require("../ast");
// import * as Sentenceparser from '../sentenceparser';
var createToken = chevrotain.createToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;
;
/* construct a mongo query from an AST */
function makeMongoDistinctGroup(cols) {
    var res = { $group: { _id: {} } };
    cols.forEach(col => {
        res.$group[col] = '$' + col;
        res.$group._id[col] = '$' + col;
    });
    return res;
}
exports.makeMongoDistinctGroup = makeMongoDistinctGroup;
function getCategoryForNodePair(nodeCat, nodeFact, sentence) {
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
}
exports.getCategoryForNodePair = getCategoryForNodePair;
;
function getCategoryForNode(nodeCat, sentence) {
    var startIndex = nodeCat && nodeCat.bearer && nodeCat.bearer.startOffset;
    if (nodeCat.type !== ast_1.ASTNodeType.CAT) {
        throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(nodeCat.type).toString()}`);
    }
    if (startIndex !== undefined && (startIndex >= 0)) {
        return sentence[startIndex].matchedString;
    }
    throw new Error(' no startindex' + JSON.stringify(nodeCat));
}
exports.getCategoryForNode = getCategoryForNode;
;
function getFactForNode(nodeFact, sentence) {
    var factIndex = nodeFact.bearer.startOffset;
    //console.log(JSON.stringify(sentence[factIndex], undefined, 2));
    return sentence[factIndex].matchedString; //.category;
}
exports.getFactForNode = getFactForNode;
;
function makeMongoName(s) {
    return mgnlq_model_1.MongoMap.makeMongoNameLC(s);
    //return s.replace(/[^a-zA-Z0-9]/g,'_');
}
exports.makeMongoName = makeMongoName;
function makeFilterObj(cat, filter) {
    var filterObj = {};
    filterObj[cat] = filter;
    return filterObj;
}
function addFilterToMatch(res, cat, filter) {
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
}
exports.addFilterToMatch = addFilterToMatch;
;
function addFilterExpr(res, expr) {
    if (res['$and']) {
        res['$and'].push(expr);
        return res;
    }
    res['$and'] = [expr];
    return res;
}
exports.addFilterExpr = addFilterExpr;
;
function addObjectProp(src, key, value) {
    src[key] = value;
    return src;
}
exports.addObjectProp = addObjectProp;
function addSortExpression(res, expr) {
    if (res['$sort']) {
        _.merge(res['$sort'], expr);
        return res;
    }
    res['$sort'] = expr;
    return res;
}
exports.addSortExpression = addSortExpression;
function getNumberArg(node, sentence) {
    var startIndex = node && node.bearer && node.bearer.startOffset;
    if (node.type !== ast_1.ASTNodeType.NUMBER) {
        throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(node.type).toString()}`);
    }
    if (startIndex !== undefined && (startIndex >= 0)) {
        //TODO treat one, two
        return parseInt(sentence[startIndex].matchedString);
    }
    throw new Error(' no startindex' + JSON.stringify(node));
}
exports.getNumberArg = getNumberArg;
;
function isArray(mongoHandleRaw, domain, category) {
    var cat = mgnlq_model_1.Model.getCategoryRec(mongoHandleRaw, domain, category);
    return _.isArray(cat.type);
}
exports.isArray = isArray;
function amendCategoryList(extractSortResult, catList) {
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
exports.amendCategoryList = amendCategoryList;
function makeMongoMatchFromAst(node, sentence, mongoMap, domain, mongoHandleRaw) {
    debug(AST.astToText(node));
    //console.log("making mongo match " + AST.astToText(node));
    if (!node) {
        return { $match: {} };
    }
    if (node.type !== ast_1.ASTNodeType.LIST) {
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
        if (n.type === ast_1.ASTNodeType.OPEqIn) {
            res = addFilterToMatch(res, mongocatfullpath, fact);
        }
        else if (n.type === ast_1.ASTNodeType.OPStartsWith) {
            res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`^${fact.toLowerCase()}`, "i") });
        }
        else if (n.type === ast_1.ASTNodeType.OPEndsWith) {
            debuglog(() => '!!!!adding regex with expression ' + fact.toLowerCase());
            res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`${fact.toLowerCase()}$`, "i") });
        } /* else if (n.type === NT.OPMoreThan) {
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
        else if (n.type === ast_1.ASTNodeType.OPLessThan || n.type === ast_1.ASTNodeType.OPMoreThan || n.type == ast_1.ASTNodeType.OPExactly) {
            var numberarg = getNumberArg(n.children[0], sentence);
            debuglog(() => '!!!!adding more than ' + numberarg + ' for category ' + category);
            //TODO //res = addFilterToMatch(res, mongocatfullpath, { 'count' ( mongocatfullpath ) gt numberarg , "i") });
            var argpath = '$' + mongocatfullpath;
            var extract = [{ $switch: { branches: [{ case: { $isArray: argpath }, then: { $size: argpath } }], default: 1 } },
                numberarg];
            switch (n.type) {
                case ast_1.ASTNodeType.OPLessThan:
                    res = addFilterExpr(res, { $expr: { $lt: extract } });
                    break;
                case ast_1.ASTNodeType.OPMoreThan:
                    res = addFilterExpr(res, { $expr: { $gt: extract } });
                    break;
                case ast_1.ASTNodeType.OPExactly:
                    res = addFilterExpr(res, { $expr: { $eq: extract } });
                    break;
            }
        }
        else if (n.type === ast_1.ASTNodeType.OPContains) {
            res = addFilterToMatch(res, mongocatfullpath, { $regex: new RegExp(`${fact.toLowerCase()}`, "i") });
        }
        else if (n.type === ast_1.ASTNodeType.OPGT || n.type === ast_1.ASTNodeType.OPLT
            || n.type == ast_1.ASTNodeType.OPEQ || n.type == ast_1.ASTNodeType.OPNE
            || n.type == ast_1.ASTNodeType.OPGE || n.type == ast_1.ASTNodeType.OPLE) {
            var fact = getFactForNode(n.children[1], sentence);
            var argpath = '$' + mongocatfullpath;
            var extract2 = [argpath, `${fact}`];
            // $switch: { branches: [ { case: { $isArray : argpath }, then: { $size: argpath } }], default : 1 }}
            var opstr = '$lt';
            switch (n.type) {
                case ast_1.ASTNodeType.OPLT:
                    opstr = '$lt';
                    break;
                case ast_1.ASTNodeType.OPGT:
                    opstr = '$gt';
                    break;
                case ast_1.ASTNodeType.OPEQ:
                    opstr = '$eq';
                    break;
                case ast_1.ASTNodeType.OPNE:
                    opstr = '$ne';
                    break;
                case ast_1.ASTNodeType.OPLE:
                    opstr = '$lte';
                    break;
                case ast_1.ASTNodeType.OPGE:
                    opstr = '$gte';
                    break;
            }
            if (isArray(mongoHandleRaw, domain, category)) {
                // db.demomdls.aggregate([ { $match: { standort : {  $elemMatch : { '$gte': 'M' }} }  }  ]);
                var filterobj = makeFilterObj(mongocatfullpath, { $elemMatch: makeFilterObj(opstr, `${fact}`) });
                res = addFilterExpr(res, filterobj);
            }
            else {
                var filterobj = makeFilterObj(mongocatfullpath, makeFilterObj(opstr, `${fact}`));
                res = addFilterExpr(res, filterobj);
            }
            //var numberarg = getNumberArg(n.children[0], sentence);
        }
        else if (n.type === ast_1.ASTNodeType.OPOrderBy || n.type === ast_1.ASTNodeType.OPOrderDescendingBy) {
            //var ascdesc = (n.type == NT.OPOrderDescendingBy) ? 1 : -1;
            // res = addSortExpression(res, addObjectProp( {}, mongocatfullpath, ascdesc ) );
            // TODO  this may be added in the wrong position
            //  one also has to assure the data is not projected out before
            //   throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
            // { $sort : { sender : -1 } }`
        }
        else if (n.type === ast_1.ASTNodeType.OPNotExisting) {
            // { item : null }
            var filterobj = makeFilterObj(mongocatfullpath, null);
            res = addFilterExpr(res, filterobj);
            //  throw new Error('Expected nodetype OPExisiting not supported here  NT.OPEqIn but was ' + n.type);
        }
        else if (n.type === ast_1.ASTNodeType.OPExisting) {
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
exports.makeMongoMatchFromAst = makeMongoMatchFromAst;
function extractExplicitSortFromAst(node, sentence, mongoMap, domain, mongoHandleRaw) {
    // return an array
    debug(AST.astToText(node));
    //console.log("making mongo match " + AST.astToText(node));
    if (!node) {
        return [];
    }
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = [];
    node.children.forEach(n => {
        var category = getCategoryForNodePair(n.children[0], n.children[1], sentence);
        var mongocatfullpath = mongoMap[category].fullpath; // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
        var fact = (n.children.length > 1) && getFactForNode(n.children[1], sentence);
        if (n.type === ast_1.ASTNodeType.OPOrderBy || n.type === ast_1.ASTNodeType.OPOrderDescendingBy) {
            var ascdesc = (n.type == ast_1.ASTNodeType.OPOrderDescendingBy) ? 1 : -1;
            res.push({
                categoryName: category,
                mongocatfullpath: mongocatfullpath,
                ascDesc: ascdesc
            });
        }
    });
    return res;
}
exports.extractExplicitSortFromAst = extractExplicitSortFromAst;
function makeMongoGroupFromAst(categoryList, mongoMap) {
    var res = {};
    categoryList.forEach(category => {
        var mongocatfullpath = mgnlq_model_1.MongoMap.getFirstSegment(mongoMap[category].paths); // Model.getMongoosePath(theModel, category); //makeMongoName(cat);
        res[mongocatfullpath] = '$' + mongocatfullpath;
    });
    var r1 = { $group: Object.assign({ _id: Object.assign({}, res) }, {}) };
    var firstX = {};
    Object.keys(res).forEach(key => { firstX[key] = { $first: '$' + key }; });
    r1.$group = Object.assign(r1.$group, firstX);
    return r1;
}
exports.makeMongoGroupFromAst = makeMongoGroupFromAst;
function makeMongoColumnsFromAst(categoryList, mongoMap) {
    var res = {
        columns: [],
        reverseMap: {}
    };
    categoryList.forEach(category => {
        res.columns.push(category);
        var catmongo = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (category !== catmongo) {
            res.reverseMap[catmongo] = category;
        }
    });
    return res;
}
exports.makeMongoColumnsFromAst = makeMongoColumnsFromAst;
function getCategoryList(fixedCategories, node, sentence) {
    var res = fixedCategories.slice();
    while (node.type !== ast_1.ASTNodeType.LIST)
        node = node.children[0];
    debug(AST.astToText(node));
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    node.children.map(n => {
        if (n.type === ast_1.ASTNodeType.CAT) {
            var category = getCategoryForNode(n, sentence);
            if (res.indexOf(category) < fixedCategories.length) {
                res.push(category);
            }
        }
        else {
            throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
        }
    });
    return res;
}
exports.getCategoryList = getCategoryList;
function makeMongoProjectionFromAst(categoryList, mongoMap) {
    var res = { _id: 0 };
    categoryList.map(category => {
        var mongocatfullpath = mongoMap[category].fullpath; //makeMongoName(cat);
        var shortName = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (shortName === mongocatfullpath) {
            res[mongocatfullpath] = 1;
        }
        else {
            res[shortName] = "$" + mongocatfullpath;
        }
    });
    return { $project: res };
}
exports.makeMongoProjectionFromAst = makeMongoProjectionFromAst;
function makeMongoSortFromAst(categoryList, mongoMap) {
    var res = {};
    categoryList.forEach(category => {
        var shortName = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        res[shortName] = 1;
    });
    return { $sort: res };
}
exports.makeMongoSortFromAst = makeMongoSortFromAst;
;
function makeMongoExplicitSort(explicitSort, categoryList, mongoMap) {
    var res = {};
    explicitSort.forEach(es => {
        var mongoCatName = es.mongocatfullpath;
        res[mongoCatName] = es.ascDesc;
    });
    categoryList.forEach(category => {
        var shortName = mgnlq_model_1.MongoMap.getShortProjectedName(mongoMap, category);
        if (res[shortName] == undefined) {
            res[shortName] = 1;
        }
    });
    return { $sort: res };
}
exports.makeMongoExplicitSort = makeMongoExplicitSort;
function makeMongoMatchF(filters) {
    var res = { $match: {} };
    //console.log('is match \n');
    filters.forEach(filter => {
        res.$match[filter.cat] = filter.value;
    });
    return res;
}
exports.makeMongoMatchF = makeMongoMatchF;
function makeMongoProjection(cols) {
    var res = { $project: { _id: 0 } };
    cols.forEach(col => {
        res.$project[col] = 1;
    });
    return res;
}
exports.makeMongoProjection = makeMongoProjection;
function makeMongoQuery(filters, resultcolumns) {
    var filter = makeMongoMatchF(filters);
    var group = makeMongoDistinctGroup(resultcolumns);
    var projection = makeMongoProjection(resultcolumns);
    return [filter, group, projection];
}
exports.makeMongoQuery = makeMongoQuery;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hc3QycXVlcnkvYXN0Mk1RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUE7OztBQVVaLGdDQUFnQztBQUNoQyw0QkFBNEI7QUFFNUIsdUNBQXVDO0FBQ3ZDLDZDQUEyRTtBQUUzRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFckMseUNBQXlDO0FBQ3pDLDhCQUE4QjtBQUU5QixnQ0FBMkM7QUFFM0MsdURBQXVEO0FBRXZELElBQUksV0FBVyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUM7QUFDekMsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUM3QixJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBSzlCLENBQUM7QUFFRix5Q0FBeUM7QUFFekMsU0FBZ0Isc0JBQXNCLENBQUMsSUFBYztJQUNuRCxJQUFJLEdBQUcsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQzVCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFQRCx3REFPQztBQUVELFNBQWdCLHNCQUFzQixDQUFDLE9BQXFCLEVBQUUsUUFBcUIsRUFBRSxRQUE0QjtJQUUvRyxpQ0FBaUM7SUFDakMscUNBQXFDO0lBQ3JDLG1DQUFtQztJQUNuQyxJQUFLLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFDbkU7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RyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUN4QyxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQVBELDBDQU9DO0FBRUQsU0FBZ0IsbUJBQW1CLENBQUMsSUFBYztJQUNoRCxJQUFJLEdBQUcsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO0lBQ25DLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDakIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEIsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFORCxrREFNQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxPQUFrQixFQUFFLGFBQXVCO0lBQ3hFLElBQUksTUFBTSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxJQUFJLEtBQUssR0FBRyxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNsRCxJQUFJLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNwRCxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztBQUVyQyxDQUFDO0FBTkQsd0NBTUMiLCJmaWxlIjoiYXN0MnF1ZXJ5L2FzdDJNUXVlcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcclxuXHJcbi8vIGJhc2VkIG9uOiBodHRwOi8vZW4ud2lraWJvb2tzLm9yZy93aWtpL0FsZ29yaXRobV9pbXBsZW1lbnRhdGlvbi9TdHJpbmdzL0xldmVuc2h0ZWluX2Rpc3RhbmNlXHJcbi8vIGFuZDogIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRGFtZXJhdSVFMiU4MCU5M0xldmVuc2h0ZWluX2Rpc3RhbmNlXHJcblxyXG5pbXBvcnQgKiBhcyBtb25nb29zZSBmcm9tICdtb25nb29zZSc7XHJcbi8vaW1wb3J0ICogYXMgbTJzIGZyb20gJy4vbW9kZWwyc2NoZW1hLmpzJztcclxuXHJcbmltcG9ydCB7IFNlbnRlbmNlIGFzIFNlbnRlbmNlLCBJRkVyQmFzZSBhcyBJRkVyQmFzZSB9IGZyb20gJy4uL21hdGNoL2VyX2luZGV4JztcclxuXHJcbmltcG9ydCAqIGFzIGRlYnVnIGZyb20gJ2RlYnVnZic7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuXHJcbi8vaW1wb3J0ICogYXMgTW9kZWwgZnJvbSAnbWdubHFfbW9kZWwnO1xyXG5pbXBvcnQgeyBJRk1vZGVsIGFzIElGTW9kZWwsIE1vbmdvTWFwLCBNb2RlbCBhcyBNb2RlbCB9IGZyb20gJ21nbmxxX21vZGVsJztcclxuXHJcbmNvbnN0IGRlYnVnbG9nID0gZGVidWcoJ2FzdDJNUXVlcnknKTtcclxuXHJcbmltcG9ydCAqIGFzIGNoZXZyb3RhaW4gZnJvbSAnY2hldnJvdGFpbic7XHJcbmltcG9ydCAqIGFzIEFTVCBmcm9tICcuLi9hc3QnO1xyXG5cclxuaW1wb3J0IHsgQVNUTm9kZVR5cGUgYXMgTlQgfSBmcm9tICcuLi9hc3QnO1xyXG5cclxuLy8gaW1wb3J0ICogYXMgU2VudGVuY2VwYXJzZXIgZnJvbSAnLi4vc2VudGVuY2VwYXJzZXInO1xyXG5cclxudmFyIGNyZWF0ZVRva2VuID0gY2hldnJvdGFpbi5jcmVhdGVUb2tlbjtcclxudmFyIExleGVyID0gY2hldnJvdGFpbi5MZXhlcjtcclxudmFyIFBhcnNlciA9IGNoZXZyb3RhaW4uUGFyc2VyO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRmlsdGVyIHtcclxuICBjYXQ6IHN0cmluZyxcclxuICB2YWx1ZTogc3RyaW5nXHJcbn07XHJcblxyXG4vKiBjb25zdHJ1Y3QgYSBtb25nbyBxdWVyeSBmcm9tIGFuIEFTVCAqL1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb0Rpc3RpbmN0R3JvdXAoY29sczogc3RyaW5nW10pOiBhbnkge1xyXG4gIHZhciByZXMgPSB7ICRncm91cDogeyBfaWQ6IHt9IH0gfTtcclxuICBjb2xzLmZvckVhY2goY29sID0+IHtcclxuICAgIHJlcy4kZ3JvdXBbY29sXSA9ICckJyArIGNvbDtcclxuICAgIHJlcy4kZ3JvdXAuX2lkW2NvbF0gPSAnJCcgKyBjb2w7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENhdGVnb3J5Rm9yTm9kZVBhaXIobm9kZUNhdCA6IEFTVC5BU1ROb2RlLCBub2RlRmFjdDogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpIHtcclxuXHJcbiAgLy8gIGVpdGhlciAgICAgICAgICAgPENBVD4gPEZBQ1Q+XHJcbiAgLy8gIG9yICAgICAgICAgICAgICAgdW5kZWZpbmVkIDxGQUNUPlxyXG4gIC8vICBvciAgTW9yZSB0aGFuICAgIDxudW1iZXI+IDxDQVQ+XHJcbiAgaWYgKCBub2RlQ2F0ICYmIG5vZGVDYXQuYmVhcmVyICYmIG5vZGVDYXQuYmVhcmVyLmltYWdlID09PSAnTlVNQkVSJyApXHJcbiAge1xyXG4gICAgcmV0dXJuIGdldENhdGVnb3J5Rm9yTm9kZVBhaXIobm9kZUZhY3QsIG5vZGVGYWN0LCBzZW50ZW5jZSk7XHJcbiAgfVxyXG4gIHZhciBzdGFydEluZGV4ID0gbm9kZUNhdCAmJiBub2RlQ2F0LmJlYXJlciAmJiBub2RlQ2F0LmJlYXJlci5zdGFydE9mZnNldDtcclxuICBkZWJ1ZygnU3RhcnRJbmRleCA6ICcgKyBzdGFydEluZGV4KTtcclxuICBkZWJ1ZygnU3RhcnRJbmRleCA6ICcgKyBKU09OLnN0cmluZ2lmeShub2RlQ2F0LCB1bmRlZmluZWQsIDIpKTtcclxuICBpZiAodHlwZW9mIHN0YXJ0SW5kZXggPT09IFwibnVtYmVyXCIgJiYgKHN0YXJ0SW5kZXggPj0gMCkpIHtcclxuICAgIHJldHVybiBzZW50ZW5jZVtzdGFydEluZGV4XS5tYXRjaGVkU3RyaW5nO1xyXG4gIH1cclxuICBpZiAoIW5vZGVDYXQgfHwgbm9kZUNhdC5jaGlsZHJlbi5sZW5ndGggPT09IDAgfHwgbm9kZUNhdC5iZWFyZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdmFyIGZhY3RJbmRleCA9IG5vZGVGYWN0LmJlYXJlci5zdGFydE9mZnNldDtcclxuICAgIGRlYnVnKEpTT04uc3RyaW5naWZ5KHNlbnRlbmNlW2ZhY3RJbmRleF0sIHVuZGVmaW5lZCwgMikpO1xyXG4gICAgcmV0dXJuIHNlbnRlbmNlW2ZhY3RJbmRleF0uY2F0ZWdvcnk7XHJcbiAgfVxyXG4gIGRlYnVnKCcgZm91bmQgbm8gY2F0ZWdvcnkgJyk7XHJcbiAgcmV0dXJuIHVuZGVmaW5lZDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXRlZ29yeUZvck5vZGUobm9kZUNhdDogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpIHtcclxuICB2YXIgc3RhcnRJbmRleCA9IG5vZGVDYXQgJiYgbm9kZUNhdC5iZWFyZXIgJiYgbm9kZUNhdC5iZWFyZXIuc3RhcnRPZmZzZXQ7XHJcbiAgaWYgKG5vZGVDYXQudHlwZSAhPT0gTlQuQ0FUKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIG5vZGV0eXBlICR7bmV3IEFTVC5Ob2RlVHlwZShOVC5DQVQpLnRvU3RyaW5nKCl9IGJ1dCB3YXMgJHtuZXcgQVNULk5vZGVUeXBlKG5vZGVDYXQudHlwZSkudG9TdHJpbmcoKX1gKTtcclxuICB9XHJcbiAgaWYgKHN0YXJ0SW5kZXggIT09IHVuZGVmaW5lZCAmJiAoc3RhcnRJbmRleCA+PSAwKSkge1xyXG4gICAgcmV0dXJuIHNlbnRlbmNlW3N0YXJ0SW5kZXhdLm1hdGNoZWRTdHJpbmc7XHJcbiAgfVxyXG4gIHRocm93IG5ldyBFcnJvcignIG5vIHN0YXJ0aW5kZXgnICsgSlNPTi5zdHJpbmdpZnkobm9kZUNhdCkpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RGb3JOb2RlKG5vZGVGYWN0OiBBU1QuQVNUTm9kZSwgc2VudGVuY2U6IElGRXJCYXNlLklTZW50ZW5jZSkge1xyXG4gIHZhciBmYWN0SW5kZXggPSBub2RlRmFjdC5iZWFyZXIuc3RhcnRPZmZzZXQ7XHJcbiAgLy9jb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShzZW50ZW5jZVtmYWN0SW5kZXhdLCB1bmRlZmluZWQsIDIpKTtcclxuICByZXR1cm4gc2VudGVuY2VbZmFjdEluZGV4XS5tYXRjaGVkU3RyaW5nOyAvLy5jYXRlZ29yeTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29OYW1lKHM6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIE1vbmdvTWFwLm1ha2VNb25nb05hbWVMQyhzKTtcclxuICAvL3JldHVybiBzLnJlcGxhY2UoL1teYS16QS1aMC05XS9nLCdfJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1ha2VGaWx0ZXJPYmooY2F0LCBmaWx0ZXIpIHtcclxuICB2YXIgZmlsdGVyT2JqID0ge307XHJcbiAgZmlsdGVyT2JqW2NhdF0gPSBmaWx0ZXI7XHJcbiAgcmV0dXJuIGZpbHRlck9iajtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZEZpbHRlclRvTWF0Y2gocmVzLCBjYXQsIGZpbHRlcikge1xyXG4gIGlmIChyZXNbJyRhbmQnXSkge1xyXG4gICAgcmVzWyckYW5kJ10ucHVzaChtYWtlRmlsdGVyT2JqKGNhdCwgZmlsdGVyKSk7XHJcbiAgICByZXR1cm4gcmVzO1xyXG4gIH1cclxuICBpZiAocmVzW2NhdF0pIHtcclxuICAgIHZhciBmaWx0ZXJzID0gT2JqZWN0LmtleXMocmVzKS5zb3J0KCkubWFwKGtleSA9PiBtYWtlRmlsdGVyT2JqKGtleSwgcmVzW2tleV0pKTtcclxuICAgIGZpbHRlcnMucHVzaChtYWtlRmlsdGVyT2JqKGNhdCwgZmlsdGVyKSk7XHJcbiAgICByZXR1cm4geyAkYW5kOiBmaWx0ZXJzIH07XHJcbiAgfVxyXG4gIHJlc1tjYXRdID0gZmlsdGVyO1xyXG4gIHJldHVybiByZXM7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkRmlsdGVyRXhwcihyZXMsIGV4cHIgOiBhbnkgKSB7XHJcbiAgaWYgKHJlc1snJGFuZCddKSB7XHJcbiAgICByZXNbJyRhbmQnXS5wdXNoKGV4cHIpO1xyXG4gICAgcmV0dXJuIHJlcztcclxuICB9XHJcbiAgcmVzWyckYW5kJ10gPSBbIGV4cHIgXTtcclxuICByZXR1cm4gcmVzO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZE9iamVjdFByb3AoIHNyYywga2V5IDogc3RyaW5nLCB2YWx1ZSA6IGFueSkgOiBhbnlcclxue1xyXG4gIHNyY1trZXldID0gdmFsdWU7XHJcbiAgcmV0dXJuIHNyYztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFkZFNvcnRFeHByZXNzaW9uKCByZXMsIGV4cHIgOiBhbnkpXHJcbntcclxuICBpZiAocmVzWyckc29ydCddKSB7XHJcbiAgICBfLm1lcmdlKCByZXNbJyRzb3J0J10sIGV4cHIgKTtcclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG4gIHJlc1snJHNvcnQnXSA9IGV4cHI7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE51bWJlckFyZyggbm9kZSA6QVNULkFTVE5vZGUgLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlICkgOiBudW1iZXJcclxue1xyXG4gIHZhciBzdGFydEluZGV4ID0gbm9kZSAmJiBub2RlLmJlYXJlciAmJiBub2RlLmJlYXJlci5zdGFydE9mZnNldDtcclxuICBpZiAobm9kZS50eXBlICE9PSBOVC5OVU1CRVIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgbm9kZXR5cGUgJHtuZXcgQVNULk5vZGVUeXBlKE5ULkNBVCkudG9TdHJpbmcoKX0gYnV0IHdhcyAke25ldyBBU1QuTm9kZVR5cGUobm9kZS50eXBlKS50b1N0cmluZygpfWApO1xyXG4gIH1cclxuICBpZiAoc3RhcnRJbmRleCAhPT0gdW5kZWZpbmVkICYmIChzdGFydEluZGV4ID49IDApKSB7XHJcbiAgICAvL1RPRE8gdHJlYXQgb25lLCB0d29cclxuICAgIHJldHVybiBwYXJzZUludChzZW50ZW5jZVtzdGFydEluZGV4XS5tYXRjaGVkU3RyaW5nKTtcclxuICB9XHJcbiAgdGhyb3cgbmV3IEVycm9yKCcgbm8gc3RhcnRpbmRleCcgKyBKU09OLnN0cmluZ2lmeShub2RlKSk7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzQXJyYXkoIG1vbmdvSGFuZGxlUmF3OiBJRk1vZGVsLklNb2RlbEhhbmRsZVJhdywgIGRvbWFpbiA6IHN0cmluZywgY2F0ZWdvcnkgOiBzdHJpbmcgKVxyXG57XHJcbiAgdmFyIGNhdCA9IE1vZGVsLmdldENhdGVnb3J5UmVjKCBtb25nb0hhbmRsZVJhdywgZG9tYWluLCBjYXRlZ29yeSApO1xyXG4gIHJldHVybiBfLmlzQXJyYXkoIGNhdC50eXBlICk7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFtZW5kQ2F0ZWdvcnlMaXN0KCBleHRyYWN0U29ydFJlc3VsdDogYW55W10sIGNhdExpc3QgOiBzdHJpbmdbXSkgOiBzdHJpbmdbXSB7XHJcbiAgdmFyIHJlcyA9IFtdO1xyXG4gIGV4dHJhY3RTb3J0UmVzdWx0LmZvckVhY2goIGEgPT4ge1xyXG4gICAgdmFyIG5hbWUgPSBhLmNhdGVnb3J5TmFtZTtcclxuICAgIGlmKCAhY2F0TGlzdC5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICByZXMucHVzaChuYW1lKTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXMgPSByZXMuY29uY2F0KGNhdExpc3QpO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29NYXRjaEZyb21Bc3Qobm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UsIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwLCBkb21haW46IHN0cmluZywgbW9uZ29IYW5kbGVSYXcgOiBJRk1vZGVsLklNb2RlbEhhbmRsZVJhdyApIHtcclxuICBkZWJ1ZyhBU1QuYXN0VG9UZXh0KG5vZGUpKTtcclxuICAvL2NvbnNvbGUubG9nKFwibWFraW5nIG1vbmdvIG1hdGNoIFwiICsgQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgaWYgKCFub2RlKSB7XHJcbiAgICByZXR1cm4geyAkbWF0Y2g6IHt9IH07XHJcbiAgfVxyXG4gIGlmIChub2RlLnR5cGUgIT09IE5ULkxJU1QpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0ZWQgZGlmZmVyZW50IG5vZGV0eXBlICcgKyBub2RlLnR5cGUpO1xyXG4gIH1cclxuICB2YXIgcmVzID0ge307XHJcbiAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKG4gPT4ge1xyXG4gICAgdmFyIGNhdGVnb3J5ID0gZ2V0Q2F0ZWdvcnlGb3JOb2RlUGFpcihuLmNoaWxkcmVuWzBdLCBuLmNoaWxkcmVuWzFdLCBzZW50ZW5jZSk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdoZXJlIGlzIHRoZSBkb21haW4gJyArIG1vbmdvZG9tYWluKTtcclxuICAgIC8vY29uc29sZS5sb2coJ2hlcmUgaXMgdGhlIGRvbWFpbiAnICsgT2JqZWN0LmtleXModGhlTW9kZWwubW9uZ29IYW5kbGUubW9uZ29NYXBzKS5qb2luKFwiXFxuXCIpKTtcclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoZU1vZGVsLm1vbmdvSGFuZGxlLm1vbmdvTWFwc1ttb25nb2RvbWFpbl0sIHVuZGVmaW5lZCwyKSk7XHJcbiAgICB2YXIgbW9uZ29jYXRmdWxscGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aDsgLy8gTW9kZWwuZ2V0TW9uZ29vc2VQYXRoKHRoZU1vZGVsLCBjYXRlZ29yeSk7IC8vbWFrZU1vbmdvTmFtZShjYXQpO1xyXG4gICAgZGVidWdsb2coKCkgPT4gYGhlcmUgaXMgdGhlIGZ1bGxwYXRoIGZvciAke2NhdGVnb3J5fSBpcyAke21vbmdvY2F0ZnVsbHBhdGh9IGApO1xyXG4gICAgdmFyIGZhY3QgPSAobi5jaGlsZHJlbi5sZW5ndGggPiAxKSAmJiBnZXRGYWN0Rm9yTm9kZShuLmNoaWxkcmVuWzFdLCBzZW50ZW5jZSk7XHJcbiAgICBpZiAobi50eXBlID09PSBOVC5PUEVxSW4pIHtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyVG9NYXRjaChyZXMsIG1vbmdvY2F0ZnVsbHBhdGgsIGZhY3QpO1xyXG4gICAgfSBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QU3RhcnRzV2l0aCkge1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJUb01hdGNoKHJlcywgbW9uZ29jYXRmdWxscGF0aCwgeyAkcmVnZXg6IG5ldyBSZWdFeHAoYF4ke2ZhY3QudG9Mb3dlckNhc2UoKX1gLCBcImlcIikgfSk7XHJcbiAgICB9IGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BFbmRzV2l0aCkge1xyXG4gICAgICBkZWJ1Z2xvZygoKSA9PiAnISEhIWFkZGluZyByZWdleCB3aXRoIGV4cHJlc3Npb24gJyArIGZhY3QudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlclRvTWF0Y2gocmVzLCBtb25nb2NhdGZ1bGxwYXRoLCB7ICRyZWdleDogbmV3IFJlZ0V4cChgJHtmYWN0LnRvTG93ZXJDYXNlKCl9JGAsIFwiaVwiKSB9KTtcclxuICAgIH0vKiBlbHNlIGlmIChuLnR5cGUgPT09IE5ULk9QTW9yZVRoYW4pIHtcclxuICAgICAgdmFyIG51bWJlcmFyZyA9IGdldE51bWJlckFyZyhuLmNoaWxkcmVuWzBdLCBzZW50ZW5jZSk7XHJcbiAgICAgIGRlYnVnbG9nKCgpID0+ICchISEhYWRkaW5nIG1vcmUgdGhhbiAnICsgbnVtYmVyYXJnICsgJyBmb3IgY2F0ZWdvcnkgJyArIGNhdGVnb3J5ICk7XHJcbiAgICAgIC8vVE9ETyAvL3JlcyA9IGFkZEZpbHRlclRvTWF0Y2gocmVzLCBtb25nb2NhdGZ1bGxwYXRoLCB7ICdjb3VudCcgKCBtb25nb2NhdGZ1bGxwYXRoICkgZ3QgbnVtYmVyYXJnICwgXCJpXCIpIH0pO1xyXG4gICAgICB2YXIgYXJncGF0aCA9ICckJyArIG1vbmdvY2F0ZnVsbHBhdGg7XHJcbiAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIoIHJlcyxcclxuICAgICAgICB7ICRleHByOiB7ICRndDogWyB7ICRzd2l0Y2g6IHsgYnJhbmNoZXM6IFsgeyBjYXNlOiB7ICRpc0FycmF5IDogYXJncGF0aCB9LCB0aGVuOiB7ICRzaXplOiBhcmdwYXRoIH0gfV0sIGRlZmF1bHQgOiAxIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICwgbnVtYmVyYXJnIF19fSApO1xyXG5cclxuLy9cclxuLy8gICAgICAgIHsgJGV4cHI6IHsgJGd0OiBbIHsgJHNpemU6ICckc3RhbmRvcnQnfSwxIF19fSApO1xyXG4vLyAgICAgIChbIHsgJG1hdGNoIDogeyAkZXhwcjogeyAkZ3Q6IFsgeyAkc2l6ZTogYXJncGF0aCB9LCBudW1iZXJhcmcgXX19fV0pO1xyXG4vLyB0d28gc3RhZ2VcclxuLy8gdXNlICRhZGRGaWVsZHMgIHdpdGggMy40XHJcbi8vIHRyeSBhbHNvICRleHByIGRpcmVjdGx5XHJcbi8vICAgICAgID4gZGIuZGVtb21kbHMuYWdncmVnYXRlKFsgeyAkcHJvamVjdCA6IHsgc3RhbmRvcnRfc2l6ZSA6IHsgJHNpemU6ICckc3RhbmRvcnQnIH0sIHN0YW5kb3J0OjEsIHNlbmRlcjoxLCB1dSA6IHsgJGd0OlsgeyAkc2l6ZTogJyRzdGFuZG9ydCcgfSwzXX0gLCBhYnggOiB7ICRndDpbIFwiJHN0YW5kb3J0XCIsIDFdfX19LCB7ICRtYXRjaDogeyBcInN0YW5kb3J0X3NpemVcIjogeyAkZXE6IHsgJHNpemU6ICckc3RhbmRvcnQnfSB9fX1dKTtcclxuLy8gICAgICA+IGRiLmRlbW9tZGxzLmFnZ3JlZ2F0ZShbIHsgJHByb2plY3QgOiB7IHN0YW5kb3J0X3NpemUgOiB7ICRzaXplOiAnJHN0YW5kb3J0JyB9LCBzdGFuZG9ydDoxLCBzZW5kZXI6MSwgdXUgOiB7ICRndDpbIHsgJHNpemU6ICckc3RhbmRvcnQnIH0sM119ICwgYWJ4IDogeyAkZ3Q6WyBcIiRzdGFuZG9ydFwiLCAxXX19fSwgeyAkbWF0Y2g6IHsgXCJzdGFuZG9ydF9zaXplXCI6IHsgJGd0OiAxIH19fV0pO1xyXG4vLyAgICAgIHsgXCJfaWRcIiA6IE9iamVjdElkKFwiNWRiODhhMTg1YjY2NzU5Y2ZjNTZiY2Q0XCIpLCBcInN0YW5kb3J0XCIgOiBbIFwiQmVybGluXCIsIFwiTcO8bmNoZW5cIiwgXCJGcmFua2Z1cnRcIiwgXCJIYW1idXJnXCIsIFwiQnJlbWVuXCIgXSwgXCJzZW5kZXJcIiA6IFwiQVJ1bmRmdW5rRFwiLCBcInN0YW5kb3J0X3NpemVcIiA6IDUsIFwidXVcIiA6IHRydWUsIFwiYWJ4XCIgOiB0cnVlIH1cclxuXHJcblxyXG4gICAgLy8gZXhhY3QgbWF0Y2g6IGRiLmRlbW9tZGxzLmFnZ3JlZ2F0ZShbIHsgJG1hdGNoOiB7IHN0YW5kb3J0IDogeyAkc2l6ZSA6IDMgfX19LFxyXG5cclxuICAgIH0qL1xyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUExlc3NUaGFuIHx8IG4udHlwZSA9PT0gTlQuT1BNb3JlVGhhbiB8fCBuLnR5cGUgPT0gTlQuT1BFeGFjdGx5KSB7XHJcbiAgICAgIHZhciBudW1iZXJhcmcgPSBnZXROdW1iZXJBcmcobi5jaGlsZHJlblswXSwgc2VudGVuY2UpO1xyXG4gICAgICBkZWJ1Z2xvZygoKSA9PiAnISEhIWFkZGluZyBtb3JlIHRoYW4gJyArIG51bWJlcmFyZyArICcgZm9yIGNhdGVnb3J5ICcgKyBjYXRlZ29yeSApO1xyXG4gICAgICAvL1RPRE8gLy9yZXMgPSBhZGRGaWx0ZXJUb01hdGNoKHJlcywgbW9uZ29jYXRmdWxscGF0aCwgeyAnY291bnQnICggbW9uZ29jYXRmdWxscGF0aCApIGd0IG51bWJlcmFyZyAsIFwiaVwiKSB9KTtcclxuICAgICAgdmFyIGFyZ3BhdGggPSAnJCcgKyBtb25nb2NhdGZ1bGxwYXRoO1xyXG4gICAgICB2YXIgZXh0cmFjdCA9IFsgeyAkc3dpdGNoOiB7IGJyYW5jaGVzOiBbIHsgY2FzZTogeyAkaXNBcnJheSA6IGFyZ3BhdGggfSwgdGhlbjogeyAkc2l6ZTogYXJncGF0aCB9IH1dLCBkZWZhdWx0IDogMSB9fVxyXG4gICAgICAsIG51bWJlcmFyZyBdO1xyXG4gICAgICBzd2l0Y2gobi50eXBlKVxyXG4gICAgICB7XHJcbiAgICAgICAgY2FzZSBOVC5PUExlc3NUaGFuOiAgICAgcmVzID0gYWRkRmlsdGVyRXhwciggcmVzLCAgeyAkZXhwcjogeyAkbHQ6IGV4dHJhY3QgfSB9ICk7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BNb3JlVGhhbjogICAgIHJlcyA9IGFkZEZpbHRlckV4cHIoIHJlcywgIHsgJGV4cHI6IHsgJGd0OiBleHRyYWN0IH0gfSApOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QRXhhY3RseTogICAgICByZXMgPSBhZGRGaWx0ZXJFeHByKCByZXMsICB7ICRleHByOiB7ICRlcTogZXh0cmFjdCB9IH0gKTsgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BDb250YWlucykge1xyXG4gICAgICByZXMgPSBhZGRGaWx0ZXJUb01hdGNoKHJlcywgbW9uZ29jYXRmdWxscGF0aCwgeyAkcmVnZXg6IG5ldyBSZWdFeHAoYCR7ZmFjdC50b0xvd2VyQ2FzZSgpfWAsIFwiaVwiKSB9KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKG4udHlwZSA9PT0gTlQuT1BHVCB8fCBuLnR5cGUgPT09IE5ULk9QTFRcclxuICAgICAgfHwgbi50eXBlID09IE5ULk9QRVEgfHwgbi50eXBlID09IE5ULk9QTkVcclxuICAgICAgfHwgbi50eXBlID09IE5ULk9QR0UgfHwgbi50eXBlID09IE5ULk9QTEUgKVxyXG4gICAge1xyXG4gICAgICB2YXIgZmFjdCA9IGdldEZhY3RGb3JOb2RlKG4uY2hpbGRyZW5bMV0sIHNlbnRlbmNlKTtcclxuICAgICAgdmFyIGFyZ3BhdGggPSAnJCcgKyBtb25nb2NhdGZ1bGxwYXRoO1xyXG4gICAgICB2YXIgZXh0cmFjdDIgPSBbIGFyZ3BhdGgsIGAke2ZhY3R9YCBdO1xyXG4gICAgICAvLyAkc3dpdGNoOiB7IGJyYW5jaGVzOiBbIHsgY2FzZTogeyAkaXNBcnJheSA6IGFyZ3BhdGggfSwgdGhlbjogeyAkc2l6ZTogYXJncGF0aCB9IH1dLCBkZWZhdWx0IDogMSB9fVxyXG5cclxuICAgICAgdmFyIG9wc3RyID0gJyRsdCc7XHJcbiAgICAgIHN3aXRjaChuLnR5cGUpXHJcbiAgICAgIHtcclxuICAgICAgICBjYXNlIE5ULk9QTFQ6ICAgICAgb3BzdHIgPSAnJGx0JzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUEdUOiAgICAgIG9wc3RyID0gJyRndCc7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTlQuT1BFUTogICAgICBvcHN0ciA9ICckZXEnOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QTkU6ICAgICAgb3BzdHIgPSAnJG5lJzsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBOVC5PUExFOiAgICAgIG9wc3RyID0gJyRsdGUnOyBicmVhaztcclxuICAgICAgICBjYXNlIE5ULk9QR0U6ICAgICAgb3BzdHIgPSAnJGd0ZSc7IGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaXNBcnJheShtb25nb0hhbmRsZVJhdywgZG9tYWluLCBjYXRlZ29yeSkpXHJcbiAgICAgIHtcclxuICAgICAgICAvLyBkYi5kZW1vbWRscy5hZ2dyZWdhdGUoWyB7ICRtYXRjaDogeyBzdGFuZG9ydCA6IHsgICRlbGVtTWF0Y2ggOiB7ICckZ3RlJzogJ00nIH19IH0gIH0gIF0pO1xyXG4gICAgICAgIHZhciBmaWx0ZXJvYmogPSBtYWtlRmlsdGVyT2JqKCBtb25nb2NhdGZ1bGxwYXRoLCB7ICRlbGVtTWF0Y2ggOiBtYWtlRmlsdGVyT2JqKCBvcHN0ciwgYCR7ZmFjdH1gICkgfSApO1xyXG4gICAgICAgIHJlcyA9IGFkZEZpbHRlckV4cHIoIHJlcywgZmlsdGVyb2JqICk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VGaWx0ZXJPYmooIG1vbmdvY2F0ZnVsbHBhdGgsIG1ha2VGaWx0ZXJPYmooIG9wc3RyLCBgJHtmYWN0fWAgKSk7XHJcbiAgICAgICAgcmVzID0gYWRkRmlsdGVyRXhwciggcmVzLCBmaWx0ZXJvYmogKTtcclxuICAgICAgfVxyXG4gICAgICAvL3ZhciBudW1iZXJhcmcgPSBnZXROdW1iZXJBcmcobi5jaGlsZHJlblswXSwgc2VudGVuY2UpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUE9yZGVyQnkgfHwgbi50eXBlID09PSBOVC5PUE9yZGVyRGVzY2VuZGluZ0J5KVxyXG4gICAge1xyXG4gICAgICAvL3ZhciBhc2NkZXNjID0gKG4udHlwZSA9PSBOVC5PUE9yZGVyRGVzY2VuZGluZ0J5KSA/IDEgOiAtMTtcclxuICAgICAgLy8gcmVzID0gYWRkU29ydEV4cHJlc3Npb24ocmVzLCBhZGRPYmplY3RQcm9wKCB7fSwgbW9uZ29jYXRmdWxscGF0aCwgYXNjZGVzYyApICk7XHJcbiAgICAvLyBUT0RPICB0aGlzIG1heSBiZSBhZGRlZCBpbiB0aGUgd3JvbmcgcG9zaXRpb25cclxuICAgIC8vICBvbmUgYWxzbyBoYXMgdG8gYXNzdXJlIHRoZSBkYXRhIGlzIG5vdCBwcm9qZWN0ZWQgb3V0IGJlZm9yZVxyXG4gICAgLy8gICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIG5vZGV0eXBlIE5ULk9QRXFJbiBidXQgd2FzICcgKyBuLnR5cGUpO1xyXG4gICAgLy8geyAkc29ydCA6IHsgc2VuZGVyIDogLTEgfSB9YFxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIG4udHlwZSA9PT0gTlQuT1BOb3RFeGlzdGluZyApXHJcbiAgICB7XHJcbiAgICAgICAvLyB7IGl0ZW0gOiBudWxsIH1cclxuICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VGaWx0ZXJPYmooIG1vbmdvY2F0ZnVsbHBhdGgsIG51bGwgKTtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyRXhwciggcmVzLCBmaWx0ZXJvYmogKTtcclxuICAgICAvLyAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBub2RldHlwZSBPUEV4aXNpdGluZyBub3Qgc3VwcG9ydGVkIGhlcmUgIE5ULk9QRXFJbiBidXQgd2FzICcgKyBuLnR5cGUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobi50eXBlID09PSBOVC5PUEV4aXN0aW5nIClcclxuICAgIHtcclxuICAgICAgdmFyIGZpbHRlcm9iaiA9IG1ha2VGaWx0ZXJPYmooIG1vbmdvY2F0ZnVsbHBhdGgsIHsgJyRleGlzdHMnIDogdHJ1ZX0gKTtcclxuICAgICAgcmVzID0gYWRkRmlsdGVyRXhwciggcmVzLCBmaWx0ZXJvYmogKTtcclxuICAgICAvLyAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCBub2RldHlwZSBPUEV4aXNpdGluZyBub3Qgc3VwcG9ydGVkIGhlcmUgIE5ULk9QRXFJbiBidXQgd2FzICcgKyBuLnR5cGUpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgbm9kZXR5cGUgTlQuT1BFcUluIGJ1dCB3YXMgJyArIG4udHlwZSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHsgJG1hdGNoOiByZXMgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RFeHBsaWNpdFNvcnRGcm9tQXN0KG5vZGU6IEFTVC5BU1ROb2RlLCBzZW50ZW5jZTogSUZFckJhc2UuSVNlbnRlbmNlLCBtb25nb01hcDogSUZNb2RlbC5DYXRNb25nb01hcCwgZG9tYWluOiBzdHJpbmcsIG1vbmdvSGFuZGxlUmF3IDogSUZNb2RlbC5JTW9kZWxIYW5kbGVSYXcgKSA6IEV4cGxpY2l0U29ydFtdIHtcclxuLy8gcmV0dXJuIGFuIGFycmF5XHJcbiAgZGVidWcoQVNULmFzdFRvVGV4dChub2RlKSk7XHJcbiAgLy9jb25zb2xlLmxvZyhcIm1ha2luZyBtb25nbyBtYXRjaCBcIiArIEFTVC5hc3RUb1RleHQobm9kZSkpO1xyXG4gIGlmICghbm9kZSkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBpZiAobm9kZS50eXBlICE9PSBOVC5MSVNUKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4cGVjdGVkIGRpZmZlcmVudCBub2RldHlwZSAnICsgbm9kZS50eXBlKTtcclxuICB9XHJcbiAgdmFyIHJlcyA9IFtdIGFzIEV4cGxpY2l0U29ydFtdO1xyXG4gIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChuID0+IHtcclxuICAgIHZhciBjYXRlZ29yeSA9IGdldENhdGVnb3J5Rm9yTm9kZVBhaXIobi5jaGlsZHJlblswXSwgbi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgdmFyIG1vbmdvY2F0ZnVsbHBhdGggPSBtb25nb01hcFtjYXRlZ29yeV0uZnVsbHBhdGg7IC8vIE1vZGVsLmdldE1vbmdvb3NlUGF0aCh0aGVNb2RlbCwgY2F0ZWdvcnkpOyAvL21ha2VNb25nb05hbWUoY2F0KTtcclxuICAgIHZhciBmYWN0ID0gKG4uY2hpbGRyZW4ubGVuZ3RoID4gMSkgJiYgZ2V0RmFjdEZvck5vZGUobi5jaGlsZHJlblsxXSwgc2VudGVuY2UpO1xyXG4gICAgaWYgKG4udHlwZSA9PT0gTlQuT1BPcmRlckJ5IHx8IG4udHlwZSA9PT0gTlQuT1BPcmRlckRlc2NlbmRpbmdCeSlcclxuICAgIHtcclxuICAgICAgdmFyIGFzY2Rlc2MgPSAobi50eXBlID09IE5ULk9QT3JkZXJEZXNjZW5kaW5nQnkpID8gMSA6IC0xO1xyXG4gICAgICByZXMucHVzaCgge1xyXG4gICAgICAgIGNhdGVnb3J5TmFtZSA6IGNhdGVnb3J5LFxyXG4gICAgICAgIG1vbmdvY2F0ZnVsbHBhdGggOiBtb25nb2NhdGZ1bGxwYXRoLFxyXG4gICAgICAgIGFzY0Rlc2MgOiBhc2NkZXNjXHJcbiAgICAgICB9IGFzIEV4cGxpY2l0U29ydCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb0dyb3VwRnJvbUFzdChjYXRlZ29yeUxpc3QgOiBzdHJpbmdbXSwgbW9uZ29NYXA6IElGTW9kZWwuQ2F0TW9uZ29NYXApIHtcclxuICB2YXIgcmVzID0ge307XHJcbiAgY2F0ZWdvcnlMaXN0LmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgdmFyIG1vbmdvY2F0ZnVsbHBhdGggPSBNb25nb01hcC5nZXRGaXJzdFNlZ21lbnQobW9uZ29NYXBbY2F0ZWdvcnldLnBhdGhzKTsgLy8gTW9kZWwuZ2V0TW9uZ29vc2VQYXRoKHRoZU1vZGVsLCBjYXRlZ29yeSk7IC8vbWFrZU1vbmdvTmFtZShjYXQpO1xyXG4gICAgcmVzW21vbmdvY2F0ZnVsbHBhdGhdID0gJyQnICsgbW9uZ29jYXRmdWxscGF0aDtcclxuICB9KTtcclxuICB2YXIgcjEgPSB7ICRncm91cDogT2JqZWN0LmFzc2lnbih7IF9pZDogT2JqZWN0LmFzc2lnbih7fSwgcmVzKSB9LCB7fSkgfTtcclxuICB2YXIgZmlyc3RYID0ge307XHJcbiAgT2JqZWN0LmtleXMocmVzKS5mb3JFYWNoKGtleSA9PiB7IGZpcnN0WFtrZXldID0geyAkZmlyc3Q6ICckJyArIGtleSB9IH0pO1xyXG4gIHIxLiRncm91cCA9IE9iamVjdC5hc3NpZ24ocjEuJGdyb3VwLCBmaXJzdFgpO1xyXG4gIHJldHVybiByMTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb0NvbHVtbnNGcm9tQXN0KGNhdGVnb3J5TGlzdCA6IHN0cmluZ1tdLCBtb25nb01hcDogSUZNb2RlbC5DYXRNb25nb01hcClcclxuICA6IHsgY29sdW1uczogc3RyaW5nW10sIHJldmVyc2VNYXA6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gfSB7XHJcbiAgdmFyIHJlcyA9IHtcclxuICAgIGNvbHVtbnM6IFtdLFxyXG4gICAgcmV2ZXJzZU1hcDoge31cclxuICB9O1xyXG4gIGNhdGVnb3J5TGlzdC5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcclxuICAgIHJlcy5jb2x1bW5zLnB1c2goY2F0ZWdvcnkpO1xyXG4gICAgdmFyIGNhdG1vbmdvID0gTW9uZ29NYXAuZ2V0U2hvcnRQcm9qZWN0ZWROYW1lKG1vbmdvTWFwLCBjYXRlZ29yeSk7XHJcbiAgICBpZiAoY2F0ZWdvcnkgIT09IGNhdG1vbmdvKSB7XHJcbiAgICAgIHJlcy5yZXZlcnNlTWFwW2NhdG1vbmdvXSA9IGNhdGVnb3J5O1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRDYXRlZ29yeUxpc3QoZml4ZWRDYXRlZ29yaWVzOiBzdHJpbmdbXSwgbm9kZTogQVNULkFTVE5vZGUsIHNlbnRlbmNlOiBJRkVyQmFzZS5JU2VudGVuY2UpOiBzdHJpbmdbXSB7XHJcbiAgdmFyIHJlcyA9IGZpeGVkQ2F0ZWdvcmllcy5zbGljZSgpO1xyXG4gIHdoaWxlICggbm9kZS50eXBlICE9PSBOVC5MSVNUIClcclxuICAgIG5vZGUgPSBub2RlLmNoaWxkcmVuWzBdO1xyXG4gIGRlYnVnKEFTVC5hc3RUb1RleHQobm9kZSkpO1xyXG4gIGlmIChub2RlLnR5cGUgIT09IE5ULkxJU1QpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignZXhwZWN0ZWQgZGlmZmVyZW50IG5vZGV0eXBlICcgKyBub2RlLnR5cGUpO1xyXG4gIH1cclxuICBub2RlLmNoaWxkcmVuLm1hcChuID0+IHtcclxuICAgIGlmIChuLnR5cGUgPT09IE5ULkNBVCkge1xyXG4gICAgICB2YXIgY2F0ZWdvcnkgPSBnZXRDYXRlZ29yeUZvck5vZGUobiwgc2VudGVuY2UpO1xyXG4gICAgICBpZiAocmVzLmluZGV4T2YoY2F0ZWdvcnkpIDwgZml4ZWRDYXRlZ29yaWVzLmxlbmd0aCkge1xyXG4gICAgICAgIHJlcy5wdXNoKGNhdGVnb3J5KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBub2RldHlwZSAke25ldyBBU1QuTm9kZVR5cGUoTlQuQ0FUKS50b1N0cmluZygpfSBidXQgd2FzICR7bmV3IEFTVC5Ob2RlVHlwZShuLnR5cGUpLnRvU3RyaW5nKCl9YCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb1Byb2plY3Rpb25Gcm9tQXN0KGNhdGVnb3J5TGlzdDogc3RyaW5nW10sIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwKSB7XHJcbiAgdmFyIHJlcyA9IHsgX2lkOiAwIH07XHJcbiAgY2F0ZWdvcnlMaXN0Lm1hcChjYXRlZ29yeSA9PiB7XHJcbiAgICB2YXIgbW9uZ29jYXRmdWxscGF0aCA9IG1vbmdvTWFwW2NhdGVnb3J5XS5mdWxscGF0aDsgLy9tYWtlTW9uZ29OYW1lKGNhdCk7XHJcbiAgICB2YXIgc2hvcnROYW1lID0gTW9uZ29NYXAuZ2V0U2hvcnRQcm9qZWN0ZWROYW1lKG1vbmdvTWFwLCBjYXRlZ29yeSk7XHJcbiAgICBpZiAoc2hvcnROYW1lID09PSBtb25nb2NhdGZ1bGxwYXRoKSB7XHJcbiAgICAgIHJlc1ttb25nb2NhdGZ1bGxwYXRoXSA9IDE7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXNbc2hvcnROYW1lXSA9IFwiJFwiICsgbW9uZ29jYXRmdWxscGF0aDtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4geyAkcHJvamVjdDogcmVzIH07XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VNb25nb1NvcnRGcm9tQXN0KGNhdGVnb3J5TGlzdDogc3RyaW5nW10sIG1vbmdvTWFwOiBJRk1vZGVsLkNhdE1vbmdvTWFwKSB7XHJcbiAgdmFyIHJlcyA9IHt9O1xyXG4gIGNhdGVnb3J5TGlzdC5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcclxuICAgIHZhciBzaG9ydE5hbWUgPSBNb25nb01hcC5nZXRTaG9ydFByb2plY3RlZE5hbWUobW9uZ29NYXAsIGNhdGVnb3J5KTtcclxuICAgIHJlc1tzaG9ydE5hbWVdID0gMTtcclxuICB9KTtcclxuICByZXR1cm4geyAkc29ydDogcmVzIH07XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRXhwbGljaXRTb3J0IHtcclxuICBjYXRlZ29yeU5hbWUgOiBzdHJpbmcsXHJcbiAgYXNjRGVzYyA6IG51bWJlcixcclxuICBtb25nb2NhdGZ1bGxwYXRoIDogc3RyaW5nXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvRXhwbGljaXRTb3J0KGV4cGxpY2l0U29ydCA6IEV4cGxpY2l0U29ydFtdLCBjYXRlZ29yeUxpc3Q6IHN0cmluZ1tdLCBtb25nb01hcDogSUZNb2RlbC5DYXRNb25nb01hcCkge1xyXG4gIHZhciByZXMgPSB7fTtcclxuICBleHBsaWNpdFNvcnQuZm9yRWFjaCggZXMgPT4ge1xyXG4gICAgdmFyIG1vbmdvQ2F0TmFtZSA9IGVzLm1vbmdvY2F0ZnVsbHBhdGg7XHJcbiAgICByZXNbbW9uZ29DYXROYW1lXSA9IGVzLmFzY0Rlc2M7XHJcbiAgfSk7XHJcbiAgY2F0ZWdvcnlMaXN0LmZvckVhY2goY2F0ZWdvcnkgPT4ge1xyXG4gICAgdmFyIHNob3J0TmFtZSA9IE1vbmdvTWFwLmdldFNob3J0UHJvamVjdGVkTmFtZShtb25nb01hcCwgY2F0ZWdvcnkpO1xyXG4gICAgaWYoIHJlc1tzaG9ydE5hbWVdID09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXNbc2hvcnROYW1lXSA9IDE7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHsgJHNvcnQ6IHJlcyB9O1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlTW9uZ29NYXRjaEYoZmlsdGVyczogSUZpbHRlcltdKSB7XHJcbiAgdmFyIHJlcyA9IHsgJG1hdGNoOiB7fSB9O1xyXG4gIC8vY29uc29sZS5sb2coJ2lzIG1hdGNoIFxcbicpO1xyXG4gIGZpbHRlcnMuZm9yRWFjaChmaWx0ZXIgPT4ge1xyXG4gICAgcmVzLiRtYXRjaFtmaWx0ZXIuY2F0XSA9IGZpbHRlci52YWx1ZTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvUHJvamVjdGlvbihjb2xzOiBzdHJpbmdbXSk6IGFueSB7XHJcbiAgdmFyIHJlcyA9IHsgJHByb2plY3Q6IHsgX2lkOiAwIH0gfTtcclxuICBjb2xzLmZvckVhY2goY29sID0+IHtcclxuICAgIHJlcy4kcHJvamVjdFtjb2xdID0gMTtcclxuICB9KTtcclxuICByZXR1cm4gcmVzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZU1vbmdvUXVlcnkoZmlsdGVyczogSUZpbHRlcltdLCByZXN1bHRjb2x1bW5zOiBzdHJpbmdbXSk6IGFueSB7XHJcbiAgdmFyIGZpbHRlciA9IG1ha2VNb25nb01hdGNoRihmaWx0ZXJzKTtcclxuICB2YXIgZ3JvdXAgPSBtYWtlTW9uZ29EaXN0aW5jdEdyb3VwKHJlc3VsdGNvbHVtbnMpO1xyXG4gIHZhciBwcm9qZWN0aW9uID0gbWFrZU1vbmdvUHJvamVjdGlvbihyZXN1bHRjb2x1bW5zKTtcclxuICByZXR1cm4gW2ZpbHRlciwgZ3JvdXAsIHByb2plY3Rpb25dO1xyXG5cclxufVxyXG5cclxuXHJcbiJdfQ==

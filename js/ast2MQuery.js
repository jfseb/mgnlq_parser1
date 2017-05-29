'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debugf");
const debuglog = debug('ast2MQuery');
const chevrotain = require("chevrotain");
const AST = require("./ast");
const ast_1 = require("./ast");
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
    return s.replace(/[^a-zA-Z0-9]/g, '_');
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
function makeMongoMatchFromAst(node, sentence, theModel) {
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
        var cat = getCategoryForNodePair(n.children[0], n.children[1], sentence);
        cat = makeMongoName(cat);
        var fact = getFactForNode(n.children[1], sentence);
        if (n.type === ast_1.ASTNodeType.OPEqIn) {
            res = addFilterToMatch(res, cat, fact);
        }
        else if (n.type === ast_1.ASTNodeType.OPStartsWith) {
            res = addFilterToMatch(res, cat, { $regex: new RegExp(`^${fact.toLowerCase()}`, "i") });
        }
        else if (n.type === ast_1.ASTNodeType.OPEndsWith) {
            res = addFilterToMatch(res, cat, { $regex: new RegExp(`${fact.toLowerCase()}$`, "i") });
        }
        else if (n.type === ast_1.ASTNodeType.OPContains) {
            res = addFilterToMatch(res, cat, { $regex: new RegExp(`${fact.toLowerCase()}`, "i") });
        }
        else {
            throw new Error('Expected nodetype NT.OPEqIn but was ' + n.type);
        }
    });
    return { $match: res };
}
exports.makeMongoMatchFromAst = makeMongoMatchFromAst;
function makeMongoGroupFromAst(node, sentence, theModel) {
    debug(AST.astToText(node));
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = {};
    node.children.forEach(n => {
        if (n.type === ast_1.ASTNodeType.CAT) {
            var cat = getCategoryForNode(n, sentence);
            cat = makeMongoName(cat);
            res[cat] = '$' + cat;
        }
        else {
            throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
        }
    });
    var r1 = { $group: Object.assign({ _id: Object.assign({}, res) }, {}) };
    var firstX = {};
    Object.keys(res).forEach(key => { firstX[key] = { $first: '$' + key }; });
    r1.$group = Object.assign(r1.$group, firstX);
    return r1;
}
exports.makeMongoGroupFromAst = makeMongoGroupFromAst;
function makeMongoColumnsFromAst(node, sentence, theModel) {
    debug(AST.astToText(node));
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = { columns: [],
        reverseMap: {} };
    node.children.forEach(n => {
        if (n.type === ast_1.ASTNodeType.CAT) {
            var cat = getCategoryForNode(n, sentence);
            res.columns.push(cat);
            var catmongo = makeMongoName(cat);
            if (cat !== catmongo) {
                res.reverseMap[catmongo] = cat;
            }
        }
        else {
            throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
        }
    });
    return res;
}
exports.makeMongoColumnsFromAst = makeMongoColumnsFromAst;
function makeMongoProjectionFromAst(node, sentence, theModel) {
    debug(AST.astToText(node));
    if (node.type !== ast_1.ASTNodeType.LIST) {
        throw new Error('expected different nodetype ' + node.type);
    }
    var res = { _id: 0 };
    node.children.forEach(n => {
        if (n.type === ast_1.ASTNodeType.CAT) {
            var cat = getCategoryForNode(n, sentence);
            cat = makeMongoName(cat);
            res[cat] = 1;
        }
        else {
            throw new Error(`Expected nodetype ${new AST.NodeType(ast_1.ASTNodeType.CAT).toString()} but was ${new AST.NodeType(n.type).toString()}`);
        }
    });
    return { $project: res };
}
exports.makeMongoProjectionFromAst = makeMongoProjectionFromAst;
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

//# sourceMappingURL=ast2MQuery.js.map

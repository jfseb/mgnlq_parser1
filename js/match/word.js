"use strict";
/**
 * @file word
 * @module jfseb.fdevstart.sentence
 * @copyright (c) Gerd Forstmann
 *
 * Word specific qualifications,
 *
 * These functions expose parf the underlying model,
 * e.g.
 * Match a tool record on a sentence,
 *
 * This will unify matching required and optional category words
 * with the requirements of the tool.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordType = exports.Word = exports.Category = void 0;
const mgnlq_model_1 = require("mgnlq_model");
const debug = require("debugf");
var debuglog = debug('word');
exports.Category = {
    CAT_CATEGORY: "category",
    CAT_DOMAIN: "domain",
    CAT_OPERATOR: "operator",
    CAT_FILLER: "filler",
    CAT_NUMBER: "number",
    CAT_TOOL: "tool",
    CAT_ANY: "any",
    _aCatFillers: ["filler"],
    isDomain: function (sCategory) {
        return sCategory === exports.Category.CAT_DOMAIN;
    },
    isCategory: function (sCategory) {
        return sCategory === exports.Category.CAT_CATEGORY;
    },
    isFiller: function (sCategory) {
        return exports.Category._aCatFillers.indexOf(sCategory) >= 0;
    }
};
exports.Word = {
    isFiller: function (word) {
        return word.category === undefined || exports.Category.isFiller(word.category);
    },
    isCategory: function (word) {
        return exports.Category.isCategory(word.category);
    },
    isDomain: function (word) {
        if (word.rule && word.rule.wordType) {
            return word.rule.wordType === 'D' /* WORDTYPE_D */;
        }
        return exports.Category.isDomain(word.category);
    }
};
exports.WordType = {
    CAT_CATEGORY: "category",
    CAT_DOMAIN: "domain",
    CAT_FILLER: "filler",
    CAT_OPERATOR: "operator",
    CAT_TOOL: "tool",
    _aCatFillers: ["filler"],
    isDomain: function (sCategory) {
        return sCategory === exports.Category.CAT_DOMAIN;
    },
    isCategory: function (sCategory) {
        return sCategory === exports.Category.CAT_CATEGORY;
    },
    isFiller: function (sCategory) {
        return exports.Category._aCatFillers.indexOf(sCategory) >= 0;
    },
    fromCategoryString: function (sCategory) {
        if (sCategory == exports.Category.CAT_CATEGORY)
            return mgnlq_model_1.IFModel.WORDTYPE.CATEGORY;
        if (sCategory == exports.Category.CAT_OPERATOR)
            return mgnlq_model_1.IFModel.WORDTYPE.OPERATOR;
        if (sCategory == exports.Category.CAT_FILLER)
            return mgnlq_model_1.IFModel.WORDTYPE.FILLER;
        if (sCategory == exports.Category.CAT_NUMBER) {
            //console.log("This is N? " + IFModel.WORDTYPE.NUMERICARG);
            return mgnlq_model_1.IFModel.WORDTYPE.NUMERICARG; // "N";
        }
        if (sCategory == exports.Category.CAT_DOMAIN)
            return mgnlq_model_1.IFModel.WORDTYPE.DOMAIN;
        if (sCategory == exports.Category.CAT_TOOL)
            return mgnlq_model_1.IFModel.WORDTYPE.TOOL;
        if (sCategory == exports.Category.CAT_ANY)
            return mgnlq_model_1.IFModel.WORDTYPE.ANY;
        debug(" unable to map to category " + sCategory);
        return undefined;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRjaC93b3JkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7R0FjRzs7O0FBU0gsNkNBQXNDO0FBR3RDLGdDQUFnQztBQUVoQyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFFaEIsUUFBQSxRQUFRLEdBQUc7SUFDdEIsWUFBWSxFQUFJLFVBQVU7SUFDMUIsVUFBVSxFQUFJLFFBQVE7SUFDdEIsWUFBWSxFQUFHLFVBQVU7SUFDekIsVUFBVSxFQUFHLFFBQVE7SUFDckIsVUFBVSxFQUFHLFFBQVE7SUFDckIsUUFBUSxFQUFHLE1BQU07SUFDakIsT0FBTyxFQUFJLEtBQUs7SUFDaEIsWUFBWSxFQUFHLENBQUMsUUFBUSxDQUFDO0lBQ3pCLFFBQVEsRUFBRyxVQUFTLFNBQWtCO1FBQ3BDLE9BQU8sU0FBUyxLQUFLLGdCQUFRLENBQUMsVUFBVSxDQUFDO0lBQzNDLENBQUM7SUFDRCxVQUFVLEVBQUcsVUFBUyxTQUFrQjtRQUN0QyxPQUFPLFNBQVMsS0FBSyxnQkFBUSxDQUFDLFlBQVksQ0FBQztJQUM3QyxDQUFDO0lBQ0QsUUFBUSxFQUFFLFVBQVMsU0FBa0I7UUFDbkMsT0FBTyxnQkFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDRixDQUFBO0FBRVksUUFBQSxJQUFJLEdBQUc7SUFDbEIsUUFBUSxFQUFHLFVBQVMsSUFBbUI7UUFDckMsT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLFNBQVMsSUFBSSxnQkFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNELFVBQVUsRUFBRyxVQUFTLElBQW1CO1FBQ3ZDLE9BQU8sZ0JBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFDRCxRQUFRLEVBQUcsVUFBUyxJQUFtQjtRQUNyQyxJQUFHLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7U0FDcEQ7UUFDRCxPQUFPLGdCQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0YsQ0FBQztBQUdXLFFBQUEsUUFBUSxHQUFHO0lBQ3RCLFlBQVksRUFBSSxVQUFVO0lBQzFCLFVBQVUsRUFBSSxRQUFRO0lBQ3RCLFVBQVUsRUFBRyxRQUFRO0lBQ3JCLFlBQVksRUFBRSxVQUFVO0lBQ3hCLFFBQVEsRUFBRyxNQUFNO0lBQ2pCLFlBQVksRUFBRyxDQUFDLFFBQVEsQ0FBQztJQUN6QixRQUFRLEVBQUcsVUFBUyxTQUFrQjtRQUNwQyxPQUFPLFNBQVMsS0FBSyxnQkFBUSxDQUFDLFVBQVUsQ0FBQztJQUMzQyxDQUFDO0lBQ0QsVUFBVSxFQUFHLFVBQVMsU0FBa0I7UUFDdEMsT0FBTyxTQUFTLEtBQUssZ0JBQVEsQ0FBQyxZQUFZLENBQUM7SUFDN0MsQ0FBQztJQUNELFFBQVEsRUFBRSxVQUFTLFNBQWtCO1FBQ25DLE9BQU8sZ0JBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQ0Qsa0JBQWtCLEVBQUUsVUFBUyxTQUFrQjtRQUU3QyxJQUFJLFNBQVMsSUFBSSxnQkFBUSxDQUFDLFlBQVk7WUFDcEMsT0FBTyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDbkMsSUFBSSxTQUFTLElBQUksZ0JBQVEsQ0FBQyxZQUFZO1lBQ3BDLE9BQU8scUJBQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ25DLElBQUksU0FBUyxJQUFJLGdCQUFRLENBQUMsVUFBVTtZQUNsQyxPQUFPLHFCQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUNqQyxJQUFJLFNBQVMsSUFBSSxnQkFBUSxDQUFDLFVBQVUsRUFDcEM7WUFDRSwyREFBMkQ7WUFDM0QsT0FBTyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPO1NBQzVDO1FBQ0QsSUFBSSxTQUFTLElBQUksZ0JBQVEsQ0FBQyxVQUFVO1lBQ2xDLE9BQU8scUJBQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ2pDLElBQUksU0FBUyxJQUFJLGdCQUFRLENBQUMsUUFBUTtZQUNoQyxPQUFPLHFCQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUMvQixJQUFLLFNBQVMsSUFBSSxnQkFBUSxDQUFDLE9BQU87WUFDaEMsT0FBTyxxQkFBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDOUIsS0FBSyxDQUFDLDZCQUE2QixHQUFHLFNBQVMsQ0FBRSxDQUFDO1FBQ2xELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FDRixDQUFBIn0=
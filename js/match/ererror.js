"use strict";
/**
 *
 * @module jfseb.fdevstart.analyze
 * @file erbase
 * @copyright (c) 2016 Gerd Forstmann
 *
 * Basic domain based entity recognition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainError = exports.makeError_EMPTY_INPUT = exports.makeError_NO_KNOWN_WORD = void 0;
const debug = require("debug");
const debuglog = debug('erbase');
const debuglogV = debug('erbase');
const perflog = debug('perf');
const AnyObject = Object;
//import { IFModel as IFModel} from 'fdevsta_monmove';
const IMatch = require("./iferbase");
function makeError_NO_KNOWN_WORD(index, tokens) {
    if (index < 0 || index >= tokens.length) {
        throw Error("invalid index in Error construction " + index + "tokens.lenth=" + tokens.length);
    }
    return {
        err_code: IMatch.ERR_NO_KNOWN_WORD,
        text: `I do not understand "${tokens[index]}".`,
        context: {
            tokens: tokens,
            token: tokens[index],
            index: index
        }
    };
}
exports.makeError_NO_KNOWN_WORD = makeError_NO_KNOWN_WORD;
function makeError_EMPTY_INPUT() {
    return {
        err_code: IMatch.ERR_EMPTY_INPUT,
        text: `I did not get an input.`,
    };
}
exports.makeError_EMPTY_INPUT = makeError_EMPTY_INPUT;
function explainError(errors) {
    if (errors.length) {
        return "\n" + errors.map(err => err.text).join("\n");
    }
    return;
}
exports.explainError = explainError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJlcnJvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXRjaC9lcmVycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7QUFLSCwrQkFBK0I7QUFFL0IsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFJOUIsTUFBTSxTQUFTLEdBQVEsTUFBTSxDQUFDO0FBSzlCLHNEQUFzRDtBQUN0RCxxQ0FBcUM7QUFFckMsU0FBZ0IsdUJBQXVCLENBQUMsS0FBYyxFQUFFLE1BQWlCO0lBQ3JFLElBQUcsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtRQUN0QyxNQUFNLEtBQUssQ0FBQyxzQ0FBc0MsR0FBRyxLQUFLLEdBQUcsZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMvRjtJQUNILE9BQU87UUFDTCxRQUFRLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtRQUNsQyxJQUFJLEVBQUcsd0JBQXdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSTtRQUNoRCxPQUFPLEVBQUc7WUFDUixNQUFNLEVBQUUsTUFBTTtZQUNkLEtBQUssRUFBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ3JCLEtBQUssRUFBRyxLQUFLO1NBQ2Q7S0FDOEIsQ0FBQztBQUNwQyxDQUFDO0FBYkQsMERBYUM7QUFHRCxTQUFnQixxQkFBcUI7SUFDbkMsT0FBTztRQUNMLFFBQVEsRUFBRSxNQUFNLENBQUMsZUFBZTtRQUNoQyxJQUFJLEVBQUcseUJBQXlCO0tBQ2QsQ0FBQztBQUN2QixDQUFDO0FBTEQsc0RBS0M7QUFFRCxTQUFnQixZQUFZLENBQUMsTUFBMEI7SUFDckQsSUFBRyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2hCLE9BQU8sSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3REO0lBQ0QsT0FBTztBQUNULENBQUM7QUFMRCxvQ0FLQyJ9
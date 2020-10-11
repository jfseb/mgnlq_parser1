"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IFErBase = exports.Word = exports.CharSequence = exports.InputFilter = exports.Sentence = exports.ErError = exports.ErBase = exports.MongoQ = void 0;
const MongoQ = require("./mongoq");
exports.MongoQ = MongoQ;
// check which of these must be exposed
const er_index_1 = require("./match/er_index");
Object.defineProperty(exports, "ErBase", { enumerable: true, get: function () { return er_index_1.ErBase; } });
const ErError = require("./match/ererror");
exports.ErError = ErError;
const Sentence = require("./match/sentence");
exports.Sentence = Sentence;
//import * as InputFilterRules from "./match/inputFilterRules";
//export { InputFilterRules };
const InputFilter = require("./match/inputFilter");
exports.InputFilter = InputFilter;
const CharSequence = require("./match/charsequence");
exports.CharSequence = CharSequence;
const Word = require("./match/word");
exports.Word = Word;
const IFErBase = require("./match/iferbase");
exports.IFErBase = IFErBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsbUNBQW1DO0FBQzFCLHdCQUFNO0FBR2YsdUNBQXVDO0FBRXZDLCtDQUFtRDtBQUMxQyx1RkFEVSxpQkFBTSxPQUNWO0FBQ2YsMkNBQTJDO0FBQ2xDLDBCQUFPO0FBQ2hCLDZDQUE2QztBQUNwQyw0QkFBUTtBQUNqQiwrREFBK0Q7QUFDL0QsOEJBQThCO0FBQzlCLG1EQUFtRDtBQUMxQyxrQ0FBVztBQUNwQixxREFBcUQ7QUFDNUMsb0NBQVk7QUFDckIscUNBQXNDO0FBQzdCLG9CQUFJO0FBQ2IsNkNBQTZDO0FBQ3BDLDRCQUFRIn0=
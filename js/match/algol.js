"use strict";
/**
 * @file algol.ts
 *
 * Constant determining the algorithm
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescribeValueListLengthCharLimit = exports.DescribeValueListMinCountValueList = exports.Top_N_WordCategorizations = exports.aReinforceDistWeight = exports.MaxSpacesPerCombinedWord = exports.Cutoff_rangeCloseMatch = exports.Cutoff_WordMatch = exports.Cutoff_LevenShtein = exports.calcDist = exports.RANKING_EPSILON = exports.Cutoff_Sentences = void 0;
/**
 * Number of sentences which are not used
 */
exports.Cutoff_Sentences = 120;
exports.RANKING_EPSILON = 0.000000001;
/*
 try 4, 1.2

 instead of 8, 1.5
*/
exports.calcDist = {
    lengthDelta1: 15,
};
/**
 * levenshtein distances above this will not be considered valid
 */
exports.Cutoff_LevenShtein = 150;
exports.Cutoff_WordMatch = 0.935; // 0.85  // 0.98
exports.Cutoff_rangeCloseMatch = 0.98;
/**
 * Maximum amount of spaces permitted in a combined word
 *
 * Note that quoted words are never combined, and may exceed this limit,
 * e.g.   A "q u o t e d" entry.
 */
exports.MaxSpacesPerCombinedWord = 3;
/**
 * Weight factor to use on the a given word distance
 * of 0, 1, 2, 3 ....
 */
exports.aReinforceDistWeight = [0.1, 0.1, 0.05, 0.02];
/**
 * only the top n words are considered
 */
exports.Top_N_WordCategorizations = 5;
exports.DescribeValueListMinCountValueList = 3;
exports.DescribeValueListLengthCharLimit = 60;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tYXRjaC9hbGdvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0E7Ozs7R0FJRzs7O0FBR0g7O0dBRUc7QUFDVSxRQUFBLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztBQUl2QixRQUFBLGVBQWUsR0FBRyxXQUFXLENBQUM7QUFFM0M7Ozs7RUFJRTtBQUVXLFFBQUEsUUFBUSxHQUFJO0lBQ3ZCLFlBQVksRUFBRyxFQUFFO0NBQ2xCLENBQUE7QUFDRDs7R0FFRztBQUNVLFFBQUEsa0JBQWtCLEdBQVksR0FBRyxDQUFDO0FBRWxDLFFBQUEsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLENBQUEsZ0JBQWdCO0FBRXpDLFFBQUEsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0FBRTNDOzs7OztHQUtHO0FBQ1UsUUFBQSx3QkFBd0IsR0FBWSxDQUFDLENBQUM7QUFFbkQ7OztHQUdHO0FBQ1UsUUFBQSxvQkFBb0IsR0FBa0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUUxRTs7R0FFRztBQUNVLFFBQUEseUJBQXlCLEdBQUcsQ0FBQyxDQUFDO0FBRTlCLFFBQUEsa0NBQWtDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLFFBQUEsZ0NBQWdDLEdBQUcsRUFBRSxDQUFDIiwiZmlsZSI6Im1hdGNoL2FsZ29sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbi8qKlxyXG4gKiBAZmlsZSBhbGdvbC50c1xyXG4gKlxyXG4gKiBDb25zdGFudCBkZXRlcm1pbmluZyB0aGUgYWxnb3JpdGhtXHJcbiAqL1xyXG5cclxuXHJcbi8qKlxyXG4gKiBOdW1iZXIgb2Ygc2VudGVuY2VzIHdoaWNoIGFyZSBub3QgdXNlZFxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IEN1dG9mZl9TZW50ZW5jZXMgPSAxMjA7XHJcblxyXG5cclxuXHJcbmV4cG9ydCBjb25zdCBSQU5LSU5HX0VQU0lMT04gPSAwLjAwMDAwMDAwMTtcclxuXHJcbi8qXHJcbiB0cnkgNCwgMS4yXHJcblxyXG4gaW5zdGVhZCBvZiA4LCAxLjVcclxuKi9cclxuXHJcbmV4cG9ydCBjb25zdCBjYWxjRGlzdCAgPSB7XHJcbiAgbGVuZ3RoRGVsdGExIDogMTUsXHJcbn1cclxuLyoqXHJcbiAqIGxldmVuc2h0ZWluIGRpc3RhbmNlcyBhYm92ZSB0aGlzIHdpbGwgbm90IGJlIGNvbnNpZGVyZWQgdmFsaWRcclxuICovXHJcbmV4cG9ydCBjb25zdCBDdXRvZmZfTGV2ZW5TaHRlaW4gOiBudW1iZXIgPSAxNTA7XHJcblxyXG5leHBvcnQgY29uc3QgQ3V0b2ZmX1dvcmRNYXRjaCA9IDAuOTM1Oy8vIDAuODUgIC8vIDAuOThcclxuXHJcbmV4cG9ydCBjb25zdCBDdXRvZmZfcmFuZ2VDbG9zZU1hdGNoID0gMC45ODtcclxuXHJcbi8qKlxyXG4gKiBNYXhpbXVtIGFtb3VudCBvZiBzcGFjZXMgcGVybWl0dGVkIGluIGEgY29tYmluZWQgd29yZFxyXG4gKlxyXG4gKiBOb3RlIHRoYXQgcXVvdGVkIHdvcmRzIGFyZSBuZXZlciBjb21iaW5lZCwgYW5kIG1heSBleGNlZWQgdGhpcyBsaW1pdCxcclxuICogZS5nLiAgIEEgXCJxIHUgbyB0IGUgZFwiIGVudHJ5LlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IE1heFNwYWNlc1BlckNvbWJpbmVkV29yZCA6IG51bWJlciA9IDM7XHJcblxyXG4vKipcclxuICogV2VpZ2h0IGZhY3RvciB0byB1c2Ugb24gdGhlIGEgZ2l2ZW4gd29yZCBkaXN0YW5jZVxyXG4gKiBvZiAwLCAxLCAyLCAzIC4uLi5cclxuICovXHJcbmV4cG9ydCBjb25zdCBhUmVpbmZvcmNlRGlzdFdlaWdodDogQXJyYXk8bnVtYmVyPiA9IFswLjEsIDAuMSwgMC4wNSwgMC4wMl07XHJcblxyXG4vKipcclxuICogb25seSB0aGUgdG9wIG4gd29yZHMgYXJlIGNvbnNpZGVyZWRcclxuICovXHJcbmV4cG9ydCBjb25zdCBUb3BfTl9Xb3JkQ2F0ZWdvcml6YXRpb25zID0gNTtcclxuXHJcbmV4cG9ydCBjb25zdCBEZXNjcmliZVZhbHVlTGlzdE1pbkNvdW50VmFsdWVMaXN0ID0gMztcclxuZXhwb3J0IGNvbnN0IERlc2NyaWJlVmFsdWVMaXN0TGVuZ3RoQ2hhckxpbWl0ID0gNjA7XHJcbiJdfQ==

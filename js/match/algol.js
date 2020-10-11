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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxnb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWF0Y2gvYWxnb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBOzs7O0dBSUc7OztBQUdIOztHQUVHO0FBQ1UsUUFBQSxnQkFBZ0IsR0FBRyxHQUFHLENBQUM7QUFJdkIsUUFBQSxlQUFlLEdBQUcsV0FBVyxDQUFDO0FBRTNDOzs7O0VBSUU7QUFFVyxRQUFBLFFBQVEsR0FBSTtJQUN2QixZQUFZLEVBQUcsRUFBRTtDQUNsQixDQUFBO0FBQ0Q7O0dBRUc7QUFDVSxRQUFBLGtCQUFrQixHQUFZLEdBQUcsQ0FBQztBQUVsQyxRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxDQUFBLGdCQUFnQjtBQUV6QyxRQUFBLHNCQUFzQixHQUFHLElBQUksQ0FBQztBQUUzQzs7Ozs7R0FLRztBQUNVLFFBQUEsd0JBQXdCLEdBQVksQ0FBQyxDQUFDO0FBRW5EOzs7R0FHRztBQUNVLFFBQUEsb0JBQW9CLEdBQWtCLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFMUU7O0dBRUc7QUFDVSxRQUFBLHlCQUF5QixHQUFHLENBQUMsQ0FBQztBQUU5QixRQUFBLGtDQUFrQyxHQUFHLENBQUMsQ0FBQztBQUN2QyxRQUFBLGdDQUFnQyxHQUFHLEVBQUUsQ0FBQyJ9
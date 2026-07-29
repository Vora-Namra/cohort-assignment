/*
  Implement a function `isPalindrome` which takes a string as argument and returns true/false as its result.
  Note: the input string is case-insensitive which means 'Nan' is a palindrom as 'N' and 'n' are considered case-insensitive.
*/
function isPalindrome(str) {
  let j = str.length - 1;

  for (let i = 0; i < j; i++) {

    while (i < j && !str.charAt(i).match(/[a-z0-9]/i)) {
      i++;
    }

    while (i < j && !str.charAt(j).match(/[a-z0-9]/i)) {
      j--;
    }

    let c1 = str.charAt(i).toLowerCase();
    let c2 = str.charAt(j).toLowerCase();

    if (c1 != c2) {
      return false;
    }

    j--;
  }

  return true;
}

module.exports = isPalindrome;
'use strict';

/**
 * Transforms a string into a camelized slug.
 *
 * @param {string} text
 * @return {string}
 *
 * Based on https://gist.github.com/eek/9c4887e80b3ede05c0e39fee4dce3747
 */
module.exports.slugify = text => {
  let slug = text.toString().trim()
    .normalize('NFD') 				 // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove all separated accents
    .replace(/(\-|\_)/g, '')        // remove hipens and underscores
    .replace(/\s+/g, '')            // remove spaces
    .replace(/&/g, '-and-')          // replace & with 'and'
    .replace(/[^\w\-]+/g, '');        // remove all non-word chars

  return slug.charAt(0).toLowerCase() + slug.substr(1);
}

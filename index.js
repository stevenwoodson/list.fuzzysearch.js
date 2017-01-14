var classes = require('classes'),
    events = require('events'),
    extend = require('extend'),
    toString = require('to-string'),
    getByClass = require('get-by-class');

module.exports = function(options) {
    options = options || {};

    options = extend({
        location: 0,
        distance: 100,
        threshold: 0.4,
        multiSearch: true,
        searchClass: 'fuzzy-search',
        relevanceSort: false
    }, options);

    var fuzzy = require('./src/fuzzy'),
        list;

    var fuzzySearch = {
        search: function(searchString, columns) {
            // Substract arguments from the searchString or put searchString as only argument
            var searchArguments = options.multiSearch ? searchString.replace(/ +$/, '').split(/ +/) : [searchString];

            for (var k = 0, kl = list.items.length; k < kl; k++) {
                fuzzySearch.item(list.items[k], columns, searchArguments);
            }

            // If the relevanceSort option is set to true, sort found items by relevance.
            if ( options.relevanceSort === true ) {
                sortOptions = {
                    sortFunction : function(itemA, itemB, options) {
                        return list.utils.naturalSort(itemA.foundScore, itemB.foundScore, options);
                    }
                };
                list.sort('naturalSort', sortOptions);
            }
        },
        item: function(item, columns, searchArguments) {
            var found = true,
                foundScore = 1;
            for (var i = 0; i < searchArguments.length; i++) {
                var foundArgument = false,
                    foundScoreArgument = 1;
                for (var j = 0, jl = columns.length; j < jl; j++) {
                    var match = fuzzySearch.values(item.values(), columns[j], searchArguments[i]);
                    if (match !== false) {
                        foundArgument = true;

                        if (match < foundScoreArgument) {
                            foundScoreArgument = match;
                        }
                    }
                }
                if (!foundArgument) {
                    found = false;
                }
                if (foundScoreArgument < 1) {
                    foundScore = foundScoreArgument;
                }
            }
            item.found = found;
            item.foundScore = foundScore;
        },
        values: function(values, value, searchArgument) {
            if (values.hasOwnProperty(value)) {
                var text = toString(values[value]).toLowerCase(),
                    match = fuzzy(text, searchArgument, options);

                if ( match !== false ) {
                    return match;
                }
            }
            return false;
        }
    };

    return {
        init: function(parentList) {
            list = parentList;

            events.bind(getByClass(list.listContainer, options.searchClass), 'keyup', function(e) {
                var target = e.target || e.srcElement; // IE have srcElement
                list.search(target.value, fuzzySearch.search);
            });

            return;
        },
        search: function(str, columns) {
            list.search(str, columns, fuzzySearch.search);
        },
        name: options.name || "fuzzySearch"
    };
};

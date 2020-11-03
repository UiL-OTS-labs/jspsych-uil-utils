'use strict'
/*
 * one line to give the program's name and an idea of what it does.
 * Copyright (C) 2020  Ty Mees, Utrecht University
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

if (typeof uil === 'undefined')
    console.error("UiL Main library not loaded! " +
        "Refusing to load randomisation functions")
else
{
    uil.randomisation = {};

    (function (context) {

        /**
         * Randomizes a given list of stimuli, but ensures no more than x
         * stimuli of the same type will appear after each other.
         *
         * x can be set by the max_same_type parameter
         *
         * The original_stimuli parameter must be an array of objects. These
         * objects must have a variable that denotes the type of this stimuli.
         * The default name is 'item_type', this can be overriden by the
         * optional type_key variable.
         *
         * The contents of this type variable can be anything that can be
         * compared. Strings are recommended for human readability.
         *
         * @param original_stimuli {array.<object>} A list of stimuli objects
         * @param max_same_type {int} The max number of items of the same type
         * that is allowed appear in succession
         * @param type_key {string} The name of the variable that denotes the
         * stimuli's type
         * @param attempt {int} Internal recursion counter. DO NOT SET YOURSELF
         *
         * @returns {null|[]} The randomized order. Null if randomization
         * failed, in which case an error will have been logged to the console
         */
        context.randomizeStimuli = function(
            original_stimuli,
            max_same_type = 2,
            type_key = 'item_type',
            attempt = 0,
        ) {
            // Stop after 10 randomize attempts, it's probably hopeless.
            if(attempt > 10)
            {
                console.error("Could not shuffle questions! This is most " +
                    "likely because there is no valid order to be made with " +
                    "the current max_same_type value!")
                return null;
            }

            let stimuli = Array.from(original_stimuli)

            let numItems = stimuli.length;
            // Array to built the new order in.
            let order = [];
            let lastType = undefined;
            let numOfLastType = 0;
            // Number of attempts to find a fitting element. (NOT the amount
            // of attempts to create a random order).
            let attempts = 0;

            while (stimuli.length > 0) {
                // Re-try if we have more attempts to find a fitting question
                // than twice all the questions.
                // In this case, the randomize algorithm has made previous
                // choices which prohibit finishing.
                if (attempts === (numItems * 2)) {
                    return context.randomize(
                        original_stimuli,
                        max_same_type,
                        type_key,
                        attempt+ 1
                    );
                }

                // Pick a random item
                let item = stimuli[Math.floor(Math.random()*stimuli.length)];
                if (typeof item[type_key] === 'undefined') {
                    console.error("The following item has no type:", item)
                    return null;
                }

                let itemType = item[type_key];

                // If this element belongs to a different group than last OR we
                // haven't reached the limit of successive items
                if (itemType !== lastType ||
                    (itemType === lastType && numOfLastType < max_same_type)) {
                    // Add it to the order
                    order.push(item);
                    // Remove it from the original list
                    stimuli.splice(stimuli.indexOf(item), 1);

                    // If this group isn't the same as last, reset
                    if (itemType !== lastType) {
                        numOfLastType = 1;
                    }
                    // Otherwise, increase the counter
                    else {
                        numOfLastType += 1;
                    }
                    // Reset these variables to the proper value
                    lastType = itemType;
                    attempts = 0;
                } else {
                    // This element doesn't fit. Count this as an attempt to
                    // find a fitting element
                    attempts += 1;
                }
            }

            return order
        }
    })(uil.randomisation)
}
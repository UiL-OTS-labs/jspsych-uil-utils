'use strict'
/*
 * (Psuedo-)Randomization functions for jsPsych
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
        "Refusing to load randomization functions");
else
{
    if ('randomization' in uil) {
        console.warn(
            "uil.randomization already exists, this is unexpected, " +
            "we'll overwrite it."
        );
    }

    uil.randomization = {};

    /**
     * Checks whether an item may be appended to the randomized items
     *
     * @param randomized {array.<object>} A pre-existing list of stimuli
     * @param constraints {object} The constraints used to examine whether an
     *                             item can be appended to randomized. The keys
     *                             need to be a key in the item parameter and
     *                             the value is the maximum number allowable
     *                             subsequent item[key] with the same value.
     * @param item {object} The object which is intended to be appended. The
     *                      constraints determine whether it fits.
     *
     * @return true if the item may be appended to randomized without violating
     *         the constraints false otherwise.
     */
    function allowPushItem (
        randomized,
        constraints,
        item
    ) {
        for (const [key, max] of Object.entries(constraints)) {
            if (max < 1) {
                throw new RangeError(
                    "max is < 1; it's impossible to fit less than one repeating items"
                );
            }
            let value = item[key];
            if (value === undefined) {
                throw ReferenceError(
                    `There is no key "${key}" in item "${item}"`
                );
            }

            let selection = randomized.slice(-max);
            selection.push(item);

            let count = 0;
            selection.forEach(stimulus => count += stimulus[key] === value);
            if (count > max)
                return false;
        }
        return true;
    }

    /**
     * Randomize the input stimuli, according to the given constraints.
     *
     * A new list of stimuli will be returned if reasonably possible.
     * The constraints are an object with a key that must also be present in
     * the original stimuli. The value of the belonging to the key, denotes
     * how many items with item[key] may have the same value in a row.
     *
     * @param original_stimuli {array.<object>} The unrandomized stimuli
     * @param constraints {object} The constraints to determine
     * how many items with the same value may be appended in a row.
     * @param nth_try {number} The nth attempt to randomize the stimuli [0, max_tries)
     * @param max_tries {number} The total number of attempts to randomize the stimuli.
     *
     * @returns {null|[]} The randomized order. Null if randomization
     * failed, in which case an error will have been logged to the console
     */
    function randomizePrivate(
        original_stimuli,
        constraints,
        nth_try,
        max_tries
    ) {
        if (max_tries < 1) {
            throw new RangeError("max_tries is < 1");
        }
        if (nth_try < 0) {
            throw new RangeError("nth_try is < 0");
        }

        if (nth_try >= max_tries) {
            console.error(
                "Unable to randomize according the constraints, "       +
                "Perhaps it is a good idea to make the constraints "    +
                "less strict."
            );
            return null;
        }

        let stimuli = Array.from(original_stimuli);
        let order = [];
        let item_attempts = 0; // Number of attempts to find a fitting stimulus

        // Pick a random fitting input stimulus and append it to the output
        // until no stimuli are left.
        while (stimuli.length > 0) {
            if (item_attempts === stimuli.length * 2) {
                return randomizePrivate(original_stimuli, constraints, nth_try + 1, max_tries);
            }
            let rand_index = Math.floor(Math.random() * stimuli.length);
            let item = stimuli[rand_index];
            if (allowPushItem(order, constraints, item)) {
                order.push(item);                         // push fitting item to output
                stimuli.splice(rand_index, 1); // and remove it from the input
                item_attempts = 0;
            }
            else {
                item_attempts += 1;
            }
        }
        return order;
    }

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
         *
         * @returns {null|[]} The randomized order. Null if randomization
         * failed, in which case an error will have been logged to the console
         */
        context.randomizeStimuli = function(
            original_stimuli,
            max_same_type = 2,
            type_key = 'item_type'
        ) {
            let constraints = {[type_key] : max_same_type}; // ES6 dependency.
            return randomizePrivate(original_stimuli, constraints, 0, 10);
        }

        context.randomizeStimuliConstraints = function (
            original_stimuli,
            constraints = {'item_type' : 2},
            max_tries = 10
        ) {
            return randomizePrivate(original_stimuli, constraints, 0, max_tries);
        }

        /**
         * Tests whether a shuffled array is meeting the constraints.
         *
         * @param stimuli {Array.<object>}
         * @param constraints {Object}
         */
        context.stimuliMeetConstraints = function(stimuli, constraints) {
            let valid = true;
            stimuli.forEach((element, index, array) => {
                for (const [key, max] of Object.entries(constraints)) {
                    const subselection = array.slice(
                        Math.max(0, index - max),
                        index
                    );
                    let count = 0;
                    subselection.forEach(item => {count += (item[key] === element[key])});
                    if (count >= max)
                        valid = false;
                }
            });
            return valid;
        }
    })(uil.randomization)
}

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

    const NOT_SHUFFLED_ERROR_MSG =
        "Unable to shuffle according to the constraints, " +
        "perhaps it is an idea to loosen the constraints.";


    /**
     * Swaps two items in an array
     * @param stimuli {Array.<object>}
     * @param i1 {int}
     * @param i2 {int}
     */
    function swapItems(stimuli, i1, i2) {
        let temp = stimuli[i1];
        stimuli[i1] = stimuli[i2];
        stimuli[i2] = temp;
    }

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

            // Select the relevant items, if max tells only 3 items are
            // allowed in a row, it only makes sense to look at those
            let selection = randomized.slice(-max);
            // Push the item that we want to append to the selection
            selection.push(item);

            let count = 0;
            selection.forEach(stimulus => count += stimulus[key] === value);

            // max items are allowed in a row, hence we should test whether
            // the count is more than max. If so reject the new item.
            if (count > max)
                return false;
        }
        return true;
    }

    /**
     * Tries to fix the order of the input, to meet the constraints.
     *
     * This function takes randomized input and does a good efford to,
     * fix it in meeting the constraints. It starts of with randomized input
     * and tries to find items in the input that meet the constraints. Once a
     * matching stimulus is found, it's removed from the input and appended.
     * to the output. Since the input is randomized, the output will still
     * be random as we have no control over the matching stimuli as they are
     * found.
     *
     * The stimuli must be ordered randomly before handing it to this function.
     * The idea is that we use the constraints to fix the order. This function
     * needs some momentum and luck in order to finish.
     * This function works pretty nice with imbalenced input if one has the
     * constraints {a : 2} and an input that is a randomized version of
     * [{a: 1}, {a: 2}, {a: 2}, ... ,{a: 1}, {a: 2}, {a: 2}], **note** that the
     * order meets the constraints prior to randomization. So there are
     * other orders out there that meet this repeating pattern {1, 2, 2},
     * but are in a different order. So we need some luck with randomizing,
     * that the start is good, and then this function is able to fix it.
     *
     * @param stimuli {Array.<object>} The input stimuli must be shuffled
     *                                 randomly prior to fixing it.
     * @param constraints {object}     The constraints used to fix the order.
     *
     * @return {Array|null} An array if the order is fixed, null otherwise
     */
    function fixOrderForConstraints(stimuli, constraints) {
        let output = [];
        let copy = Array.from(stimuli)
        while(copy.length > 0) {
            let fitting = copy.findIndex((element) => {
                return allowPushItem(output, constraints, element);
            });
            if (fitting < 0) {
                return null;
            }
            else {
                output.push(copy[fitting]); // Push the fitting item
                copy.splice(fitting, 1);
            }
        }
        return output;
    }

    /**
     * Private randomization function see
     * uil.randomization.randomizeStimuliConstraints() for elaborate details
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
            console.error(NOT_SHUFFLED_ERROR_MSG);
            return null;
        }

        let stimuli = Array.from(original_stimuli);
        let order = [];
        let item_attempts = 0; // Number of attempts to find a fitting stimulus

        // Pick a random fitting input stimulus and append it to the output
        // until no stimuli are left.
        while (stimuli.length > 0) {
            if (item_attempts === stimuli.length * 2) {
                return randomizePrivate(
                    original_stimuli,
                    constraints,
                    nth_try + 1,
                    max_tries
                );
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
         * @param max_tries {number} The total number of attempts to randomize the stimuli.
         *
         * @returns {null|[]} The randomized order. Null if randomization
         * failed, in which case an error will have been logged to the console
         */
        context.randomizeStimuliConstraints = function (
            original_stimuli,
            constraints = {'item_type' : 2},
            max_tries = 10
        ) {
            return randomizePrivate(original_stimuli, constraints, 0, max_tries);
        }

        /**
         * Returns a copy of the input that is shuffled pseudo randomly
         *
         * @param original_stimuli {Array}
         *
         * @return {Array} A shuffled version of the input.
         */
        context.randomShuffle = function(original_stimuli) {
            let copy = Array.from(original_stimuli);
            for (let i = 0; i < copy.length; i++) {
                let swap_index = i + Math.floor(
                    Math.random() * (copy.length - i)
                );
                swapItems(copy, i, swap_index);
            }
            return copy;
        }

        /**
         * Randomizes the stimuli.
         *
         * This function also randomizes the stimuli. This function
         * may give a little bit more luck when your constraints are
         * very strict or when there is an imbalance in the input.
         * An imbalance occurs when your stimuli are:
         * [{a:1},{a:1},{a:2},....{a:1},{a:1},{a:2}]
         * There are twice as many ones in the stimuli compared to two's.
         *
         * This function might be more expensive compared to:
         * uil.randomization.randomizeStimuli(Constraints).
         *
         * @param original_stimuli {Array.<Object>}
         * @param constraints {Object} The object that defines the constraints
         * @param max_tries {number} A number larger or equal to 1.
         *
         * @return {null|Array.<Object>}
         */
        context.randomShuffleConstraints = function(
            original_stimuli,
            constraints= {},
            max_tries= 10
        ) {
            if (max_tries < 1) {
                throw new RangeError("max_tries is < 1");
            }

            let output = null;
            // Randomize stimuli and try to see if we can fix the order,
            // We break out of the loop after max_tries or a valid input
            // has been found.
            for (let i = 0; i < max_tries && output === null; i++) {
                let copy = uil.randomization.randomShuffle(original_stimuli);
                output = fixOrderForConstraints(copy, constraints);
            }
            if (output === null) {
                console.error(NOT_SHUFFLED_ERROR_MSG);
            }
            return output;

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

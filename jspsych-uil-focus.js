/*
 * Focus module to check whether particpants keep there focus on the task.
 * Copyright (C) 2023  Maarten Duijndam
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


export {
    FocusStats,
    registerUserFocus,
    clearUserFocus,
    getStats,
};

const FOCUS = "focus";
const BLUR = "blur";
const VISIBILITYCHANGE = "visibilitychange";

let g_focus = null;

/**
 * Get an aggregate structure that describes the statistics on how
 * dedicated the pc was to the experiment vs other tasks. All durations
 * are in seconds, as that is more intuitive than milliseconds.
 *
 * **TODO** document what focus and shows/hides mean.
 */
class FocusStats {
    constructor (
        is_active,
        cum_active,
        cum_inactive,
        num_focus,
        num_focus_lost,
        num_shows,
        num_hides
    ) {
        /**
         * Whether the client is currently looking at the desired page
         */
        this.is_active = is_active;

        /**
         * The cumulative time that the participant is active
         */
        this.cum_active= cum_active;

        /**
         * The cumulative time that the participant is **not** active
         */
        this.cum_inactive = cum_inactive;

        /**
         * The number of time the browser focused on **our** tab
         */
        this.num_focus = num_focus;

        /**
         * The number of times that **our** tab lost the focus
         */
        this.num_focus_lost  = num_focus_lost;
        /**
         * The number of times that **our** tab is unhidden.
         */
        this.num_shows = num_shows;
        /**
         * The number of times that **our** tab is hidden.
         */
        this.num_hides = num_hides;
    }
}

/**
 * Class for keeping track of statistics about when and how the participant
 * has keyboard focus on the experiment.
 */
class FocusStatsKeeper {

    constructor () {
        
        if (window.document.hasFocus()) {
            this.has_focus = true;
            this.num_focus_captured = 1;
            this.num_focus_lost = 0;
        }
        else {
            this.has_focus = false
            this.num_focus_captured = 0;
            this.num_focus_lost= 1;
        }
        if (document.hidden) {
            this.is_visible = false;
            this.num_hides = 1;
            this.num_shows = 0;
        }
        else {
            this.is_visible = true;
            this.num_hides = 0;
            this.num_shows = 1;
        }
        this.tp_active = performance.now();
        this.tp_inactive = this.tp_active;
        this.cum_active = 0;
        this.cum_inactive = 0;
    }

    /**
     * The user is considered to be actively working on the task when
     * The tab is visible and the browser window has the focus, not another
     * window.
     */
    get active() {
        if (this.is_visible && this.has_focus )
            return true;
        else
            return false;
    }

    _updateCumInActive() {
        this.tp_active = performance.now()
        this.cum_inactive += (this.tp_active - this.tp_inactive);
    }

    _updateCumActive() {
        this.tp_inactive = performance.now();
        this.cum_active += (this.tp_inactive - this.tp_active);
    }

    captureFocus() {
        console.assert(this.has_focus === false);
        let was_active = this.active;
        this.has_focus = true;
        this.num_focus_captured += 1;

        if (this.active != was_active) {
            console.assert(this.active === true && was_active === false);
            this._updateCumInActive();
        }
    }
    
    loseFocus() {
        console.assert(this.has_focus === true);
        let was_active = this.active;
        this.has_focus = false;
        this.num_focus_lost += 1;

        if (this.active != was_active) {
            console.assert(this.active === false && was_active === true);
            this._updateCumActive();
        }
    }

    hide() {
        console.assert(this.is_visible === true);
        let was_active = this.active;
        this.is_visible = false;
        this.num_hides += 1;

        if (this.active != was_active) {
            console.assert(this.active === false && was_active === true);
            this._updateCumActive();
        }
    }
    
    show () {
        console.assert(this.is_visible === false);
        let was_active = this.active;
        this.is_visible = true;
        this.num_shows += 1;

        if (this.active != was_active) {
            console.assert(this.active === true && was_active === false);
            this._updateCumInActive();
        }
    }

    getStats() {
        let tp_now = performance.now();
        let stats;
        if (this.active)
            stats = new FocusStats(
                this.active,
                (this.cum_active + (tp_now - this.tp_active))/1e3,
                this.cum_inactive/1e3,
                this.num_focus_captured,
                this.num_focus_lost,
                this.num_shows,
                this.num_hides
            );
        else
            stats = new FocusStats(
                this.active,
                this.cum_active/1e3,
                (this.cum_inactive + (tp_now - this.tp_inactive))/1e3,
                this.num_focus_captured,
                this.num_focus_lost,
                this.num_shows,
                this.num_hides
            );
        return stats;
    }
}

/**
 * This class installs event handlers for when the browser/tab loses focus,
 * e.g. the user activates another browser/program. Also the visibilty changes
 * When a user activates another tab. The focus manager installs callbacks
 * for this events. It uses a FocusStatsKeeper in order to track the statistics
 * about the time a user is active and about how many times the user changes
 * tabs or programs.
 */
class FocusManager {

    constructor() {
        // this event fires when the focus is captured
        window.addEventListener(FOCUS, this.onFocusCaptured.bind(this));
        // this event fires when the focus is lost eg. when another application
        // get keyboard focus.
        window.addEventListener(BLUR, this.onFocusLost.bind(this));
        // this event 
        window.addEventListener(
            VISIBILITYCHANGE, this.onVisibilityChange.bind(this)
        );

        this.stats_keeper = new FocusStatsKeeper;
    }

    onFocusCaptured() {
        this.stats_keeper.captureFocus();
    }

    onFocusLost() {
        this.stats_keeper.loseFocus();
    }

    onVisibilityChange() {
        if (document.hidden) {
            this.stats_keeper.hide();
        }
        else {
            this.stats_keeper.show();
        }
    }


    removeEventListeners() {
        window.removeEventListener(FOCUS, this.onFocusCaptured);
        window.removeEventListener(BLUR, this.onFocusLost);
        window.removeEventListener(VISIBILITYCHANGE, this.onVisibilityChange);
    }

    getStats() {
        return this.stats_keeper.getStats();
    }
}

/**
 * Registers capturing and losing focus inside an experiment.
 *
 * When this function is called, the utils will keep track when the window/tab
 * loses its focus/visibility. It will get be noticed when the user changes
 * browser tabs (visibility) or changes programs (focus).
 */
function registerUserFocus () {
    if (g_focus === null) {
        g_focus = new FocusManager;
    } else {
        console.debug("registerUserFocus is already called");
    }
}

/**
 * Undo's the actions of registerUserFocus()
 *
 * If you need the statistics about the user focus, make sure you'll obtain
 * the before calling this function.
 */
function clearUserFocus () {
    if (g_focus !== null) {
        g_focus.removeEventListeners();
        g_focus = null;
    }
}

/**
 * Obtain the current statics about the user, losing and capturing the
 * focus of the window. It might be a measure on how dedicated the user was
 * vs how distracted the user was.
 *
 * @returns {FocusStats|undefined} The statistics since registerUserFocus()has been 
 * called or undefined when registerUserFocus hasn't been called or clearUserFocus
 * has been called.
 */
function getStats() {
    return (g_focus !== null) ? g_focus.getStats() : undefined;
}

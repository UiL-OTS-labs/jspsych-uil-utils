import * as randomization from "../jspsych-uil-randomization.js";

const ITEM_TYPES = [
    "filler",
    "active",
    "passive",
    "distractor"
];

const COLORS = [
    "yellow",
    "red",
    "blue",
    "green"
];

const IMBALANCED_BISTATE = [
    "true",
    "true",
    "false"
]

function createStimuli(n) {
    let stimuli = [];
    const N = n;
    for (let i = 0; i < N; i++) {
        stimuli.push (
            {
                id : i + 1,
                item_type : ITEM_TYPES[i % ITEM_TYPES.length],
                color : COLORS[Math.floor(i / (N / COLORS.length))],
                bi_state : IMBALANCED_BISTATE[i % IMBALANCED_BISTATE.length]
            }
        );
    }
    return stimuli;
}

describe('randomization', () => {
    it('should meet constraints', () => {
        let impropper = [
            {a : 3},
            {a : 3}
        ];
        let propper = [
            {a : 1},
            {a : 2}
        ];
        let complex_proper = [
            {a : 1, b:2},
            {a : 2, b:3},
        ]
        let complex_improper = [
            {a : 1, b:2},
            {a : 2, b:2},
        ]

        // This catches errors when miscounting, it should be valid for {a:3}.
        // This catches errors when miscounting, it should be invalid for {a:2}.
        let multiple_non_adjacent = [
            {a : 1},
            {a : 1},
            {a : 1},
            {a : 0},
            {a : 1},
            {a : 1},
            {a : 1},
        ];

        expect(
            randomization.stimuliMeetConstraints(
                impropper, {a : 1}
            )).toBeFalse()

        expect(
            randomization.stimuliMeetConstraints(
                propper, {a : 1}
            )).toBeTrue();

        expect(
            randomization.stimuliMeetConstraints(
                complex_improper, {a:1, b:1}
            )).toBeFalse();

        expect(
            randomization.stimuliMeetConstraints(
                complex_proper, {a:1, b:1}
            )).toBeTrue();

        expect(
            randomization.stimuliMeetConstraints(
                multiple_non_adjacent, {a:3}
            )).toBeTrue();

        expect(
            randomization.stimuliMeetConstraints(
                multiple_non_adjacent, {a:2}
            )).toBeFalse();
    });

    it('should randomize without constraints', () => {
        let stimuli = createStimuli(10);
        // no constraints this is just a shuffle.
        let shuffled = randomization.randomizeStimuliConstraints(
            stimuli,
            {}
        );

        // there is a 1 in 10! 10 * 9 .... * 1 chance that this fails.
        expect(shuffled).not.toBe(stimuli);
        shuffled = randomization.randomizeStimuli(stimuli, 10);
        expect(shuffled).not.toBe(stimuli);
    });

    it('should randomize with constraints', () => {
        let stimuli = createStimuli(100);
        let constraints = {item_type : 3};

        let shuffled = randomization.randomizeStimuliConstraints(
            stimuli,
            constraints
        )
        expect(shuffled).not.toBe(null);
        expect(shuffled).not.toBe(stimuli);
        expect(randomization.stimuliMeetConstraints(shuffled, constraints)).toBeTrue();

        constraints = {item_type: 2, color: 2, bi_state:10};
        shuffled = randomization.randomizeStimuliConstraints(
            stimuli,
            constraints
        );

        expect(shuffled).not.toBe(null);
        expect(shuffled).not.toBe(stimuli);
        expect(randomization.stimuliMeetConstraints(shuffled, constraints)).toBeTrue();
    });

    it('should randomize with hard constraints', () => {
        let stimuli = createStimuli(100);
        let constraints = {
            bi_state : 2,
            item_type : 2,
            color : 2
        };

        /*
         * there must be a sequence true, true, false, ...., true, true, false out there
         * that is not the input and meets the constraints, it's just unlikely that it
         * will ever pop-up.
         * The problem that occurs eventually is that the rules need to have a false, while
         * there are only true values remaining.
         */
        let shuffled = randomization.randomShuffleConstraints (
            stimuli, constraints, 100
        );
        expect(shuffled).not.toBe(null);
        expect(shuffled).not.toBe(stimuli);
        expect(randomization.stimuliMeetConstraints(shuffled, constraints)).toBeTrue();
    });

    it('should not be slow', () => {
        let constraints = {item_type : 3};
        const niters = 100;
        const num_stim = 1000;

        function benchmarkFunction(N, func, constraints) {
            let stims = createStimuli(num_stim);
            let tstart = performance.now();
            for (let i = 0; i < N; i++) {
                let shuffled = func(stims, constraints);
            }
            let tend = performance.now();
            return ((tend - tstart) / N);
        }

        expect(benchmarkFunction(
            niters,
            randomization.randomShuffle,
            constraints,
        )).toBeLessThan(100);

        expect(benchmarkFunction(
            niters,
            randomization.randomizeStimuliConstraints,
            constraints,
        )).toBeLessThan(100);

        expect(benchmarkFunction(
            niters,
            randomization.randomShuffleConstraints,
            constraints,
        )).toBeLessThan(100);

        constraints = {
            item_type : 2,
            color : 2,
        };

        expect(benchmarkFunction(
            niters,
            randomization.randomizeStimuliConstraints,
            constraints,
        )).toBeLessThan(100);

        expect(benchmarkFunction(
            niters,
            randomization.randomShuffleConstraints,
            constraints,
        )).toBeLessThan(100);
    });
});

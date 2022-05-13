import {reimport} from "./support/reimport.mjs";

function mockFetch(json) {
    let response = new Response(JSON.stringify(json), {status: 200});
    let spy = spyOn(window, 'fetch').and.resolveTo(response);
    return spy;
}

describe('session api', () => {
    let session;
    beforeEach(async () => {session = await reimport('../jspsych-uil-session.js');});

    let key = '01e6506c-8538-4f83-bb3f-f7cf2ba7f63f';

    it('should start a session', (done) => {
        mockFetch({
            group_name: 'A',
            subject_id: 'xyz'
        });

        session.start(key, (group_name) => {
            expect(group_name).toBe('A');
            expect(session.isActive()).toBeTrue();
            expect(session.subjectId()).toBe('xyz');
            done();
        });
    });

    it('repots inactive session when not started', () => {
        expect(session.isActive()).toBeFalse();
    });
});

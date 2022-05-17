import {reimport} from "./support/reimport.mjs";

function mockFetch(json, status = 200) {
    let response = new Response(JSON.stringify(json), {status: status});
    if (jasmine.isSpy(fetch)) {
        fetch.and.resolveTo(response);
    }
    else {
        spyOn(window, 'fetch').and.resolveTo(response);
    }
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

    it('should upload results', (done) => {
        mockFetch({
            group_name: 'A',
            subject_id: 'xyz',
            session_id: 'test_session_id'
        });

        session.start(key, (group_name) => {
            expect(group_name).toBe('A');
            expect(session.isActive()).toBeTrue();
            expect(session.subjectId()).toBe('xyz');

            mockFetch({});
            expect(() =>
                {
                    session.upload(key, {test_data: 1});
                    done();
                }).not.toThrow();
        });

    });

    it('reports inactive session when not started', () => {
        expect(session.isActive()).toBeFalse();
    });

    xit('should not fail silently', (done) => {
        mockFetch({}, 400);
        expect(() => {session.start(key, done)}).toThrow();
    });

    it('fails to upload without a session', () => {
        mockFetch({}, 200);
        expect(() => {session.upload(key, {})}).toThrow();
    });
});

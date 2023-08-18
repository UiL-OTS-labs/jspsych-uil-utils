import {reimport} from "../support/reimport.mjs";

describe('online/offline detection', () => {
    let env;
    beforeEach(async () => { env = await reimport('../libs/env.js'); });

    it('should be online', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'https:', hostname:'uu.nl'}});
        expect(env.isOnline()).toBeTrue();
    });

    it('should be offline for file://', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'file://', hostname:'uu.nl'}});
        expect(env.isOnline()).toBeFalse();
    });

    it('should be offline for localhost', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'http://', hostname:'localhost'}});
        expect(env.isOnline()).toBeFalse();
    });

    it('should be offline for 127.0.0.1', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'http://', hostname:'127.0.0.1'}});
        expect(env.isOnline()).toBeFalse();
    });

});

import "../node_modules/jasmine-ajax/lib/mock-ajax.js";
import {withFakePromise} from "./support/fake-promise.mjs";
import {reimport} from "./support/reimport.mjs";


describe('online/offline detection', () => {
    let utils;
    beforeEach(async () => { utils = await reimport('../jspsych-uil-utils.js'); });

    it('should be online', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'https:', hostname:'uu.nl'}});
        expect(utils.isOnline()).toBeTrue();
    });

    it('should be offline for file://', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'file://', hostname:'uu.nl'}});
        expect(utils.isOnline()).toBeFalse();
    });

    it('should be offline for localhost', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'http://', hostname:'localhost'}});
        expect(utils.isOnline()).toBeFalse();
    });

    it('should be offline for 127.0.0.1', () => {
        spyOnProperty(window, '$window').and.returnValue(
            {location: {protocol:'http://', hostname:'127.0.0.1'}});
        expect(utils.isOnline()).toBeFalse();
    });

});

describe('experiment metadata', () => {
    let utils;
    beforeEach(async () => { utils = await reimport('../jspsych-uil-utils.js'); });

    beforeEach(() => jasmine.Ajax.install());
    afterEach(() => jasmine.Ajax.uninstall());

    let key = '01e6506c-8538-4f83-bb3f-f7cf2ba7f63f';

    function respond(json) {
        let request = jasmine.Ajax.requests.mostRecent();
        expect(request).toBeDefined();
        request.respondWith({status: 200, responseText:json});
    }

    it('should stop experiment if closed', () => {
        // fake online
        let win = {location: {protocol:'https:', hostname:'uu.nl'}};
        spyOnProperty(window, '$window').and.returnValue(win);

        withFakePromise(() => {utils.stopIfExperimentClosed(key);});
        respond({state: 'Closed'});
        expect(win.location).toMatch(/\/closed\/$/);
    });

    it('should not stop experiment if open', () => {
        // fake online
        let win = {location: {protocol:'https:', hostname:'uu.nl'}};
        spyOnProperty(window, '$window').and.returnValue(win);

        withFakePromise(() => {utils.stopIfExperimentClosed(key);});
        respond({state: 'Open'});
        expect(win.location).not.toMatch(/\/closed\/$/);
    });
});


describe('saveJson', () => {
    let utils;
    beforeEach(async () => { utils = await reimport('../jspsych-uil-utils.js'); });

    beforeEach(() => jasmine.Ajax.install());
    afterEach(() => jasmine.Ajax.uninstall());

    let key = '01e6506c-8538-4f83-bb3f-f7cf2ba7f63f';
    let data = {test_data:'hello'};

    it('should make a request when online', () => {
        // fake online
        let win = {location: {protocol:'https:', hostname:'uu.nl'}};
        spyOnProperty(window, '$window').and.returnValue(win);

        utils.saveJson(JSON.stringify(data), key);
        let request = jasmine.Ajax.requests.mostRecent();
        expect(request).toBeDefined();
        expect(request.url).toMatch(new RegExp(`/api/${key}/upload/$`));
        expect(request.requestHeaders['Content-Type']).toBe('text/plain');
        expect(request.params).toBe(JSON.stringify(data));
    });

    it('should display json when offline', () => {
        let mockBody = document.createElement('body');
        spyOnProperty(document, 'body').and.returnValue(mockBody);
        utils.saveJson(JSON.stringify(data), key);

        let parsed = JSON.parse(mockBody.innerText);
        expect(parsed).toEqual(data);
    });
});

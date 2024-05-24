import "../node_modules/jasmine-ajax/lib/mock-ajax.js";
import {withFakePromise} from "./support/fake-promise.mjs";
import {reimport} from "./support/reimport.mjs";


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

    it('should display json when offline', async () => {
        let open = spyOn(window, 'open');

        utils.saveJson(JSON.stringify(data), key);

        expect(open).toHaveBeenCalled();
        let blob = await fetch(open.calls.first().args[0], {headers: {'content-type': 'text/html;charset=utf-8'}});
        let dom = new DOMParser().parseFromString(await blob.text(), 'text/html');
        let parsed = JSON.parse(dom.querySelector('pre').innerText);
        expect(parsed).toEqual(data);
    });
});

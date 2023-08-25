import * as browser from "../jspsych-uil-browser.js";

describe('browser info', () => {
    let info = browser.getBrowserInfo();

    it('should not be empty', () => {
        expect(Object.keys(info).length).toBeGreaterThan(0);
    });

    it('should be correct for headless chrome', () => {
        expect(info.isMobile).toBeFalse();
        expect(info.isTablet).toBeFalse();
        expect(info.isTouchCapable).toBeFalse();
    });
});

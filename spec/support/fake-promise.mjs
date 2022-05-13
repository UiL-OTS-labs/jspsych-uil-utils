export {
    FakePromise,
    withFakePromise
}

class FakePromise {
    // used in combination with jasmine-ajax to mock server requests
    constructor(func) {
        this.func = func
    }
    then(resolve, reject) {
        this.func(resolve, reject);
    }
}

function withFakePromise(func) {
    let Promise_ = Promise;
    window.Promise = FakePromise;
    func();
    window.Promise = Promise_;
}

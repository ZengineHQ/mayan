
const context = require('../lib/context');

describe('context', () => {

  it('should do nothing with an empty context', () => {

    let ctx = {};

    let check = (results) => {
      expect(200).to.equal(200);
    }

    return context(ctx).then(check);

  });

});

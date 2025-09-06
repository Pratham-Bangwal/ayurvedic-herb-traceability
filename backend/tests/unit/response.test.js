const { success, error } = require('../../src/utils/response');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockImplementation((body) => body); // return payload for ease of assertion
  return res;
}

describe('response helpers', () => {
  test('success wraps data with default status 200', () => {
    const res = mockRes();
    const payload = success(res, { hello: 'world' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(payload).toEqual({ data: { hello: 'world' } });
  });

  test('success custom status', () => {
    const res = mockRes();
    success(res, { ok: true }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('error wraps code+message with default 400', () => {
    const res = mockRes();
    const payload = error(res, 'E_BAD', 'Boom');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(payload).toEqual({ error: { code: 'E_BAD', message: 'Boom' } });
  });

  test('error custom status', () => {
    const res = mockRes();
    error(res, 'E_AUTH', 'Denied', 403);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

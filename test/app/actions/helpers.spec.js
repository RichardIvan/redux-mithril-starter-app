import expect from 'expect';
import fetchMock from 'fetch-mock';
import {Schema, arrayOf} from 'normalizr';
import {isFSA} from 'flux-standard-action';
import {createThunkStore} from './helpers';
import {createFetchAction} from '../../../app/actions/helpers';

describe('action helpers', function () {
  const SOME_ACTION = 'SOME_ACTION';

  describe('#createFetchAction', function () {
    let store = null;

    beforeEach('create store', function () {
      store = createThunkStore(state => state, {
        pending: [],
      });
    });

    beforeEach('mock GET /api/users', function () {
      fetchMock.get('/api/users', {
        body: [
          {
            id: 1,
            name: 'Some User',
            teams: [
              {
                id: 1,
                name: 'Some Team',
              },
            ],
          },
        ],
      });
    });

    afterEach('restore fetch', function () {
      fetchMock.restore();
    });

    context('when called without action type', function () {
      it('throws missing type error', function () {
        expect(() => createFetchAction()).toThrow(/must specify an action type/i);
      });
    });

    context('when called without url', function () {
      it('throws missing url error', function () {
        expect(() => createFetchAction(SOME_ACTION)).toThrow(/must specify a url/i);
      });
    });

    context('when called with url', function () {
      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users',
        }));
      });

      it('creates pending fetch action for url', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            pending: {
              id: 'GET /api/users',
            },
          },
        });
      });

      it('creates completed fetch action for url', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: false,
          payload: [
            {
              id: 1,
              name: 'Some User',
              teams: [
                {
                  id: 1,
                  name: 'Some Team',
                },
              ],
            },
          ],
          meta: {
            pending: {
              id: 'GET /api/users',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when called with method', function () {
      beforeEach('mock POST /api/users', function () {
        fetchMock.post('/api/users', {
          body: [
            {
              id: 1,
              name: 'Some User',
            },
          ],
        });
      });

      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users',
          method: 'POST',
        }));
      });

      it('creates pending fetch action for method', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            pending: {
              id: 'POST /api/users',
            },
          },
        });
      });

      it('creates completed fetch action for method', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: false,
          payload: [
            {
              id: 1,
              name: 'Some User',
            },
          ],
          meta: {
            pending: {
              id: 'POST /api/users',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when called with id', function () {
      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users',
          id: 'something else',
        }));
      });

      it('creates pending fetch action with id', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            pending: {
              id: 'something else',
            },
          },
        });
      });

      it('creates completed fetch action with id', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: false,
          payload: [
            {
              id: 1,
              name: 'Some User',
              teams: [
                {
                  id: 1,
                  name: 'Some Team',
                },
              ],
            },
          ],
          meta: {
            pending: {
              id: 'something else',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when called with meta', function () {
      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users',
          meta: {
            silent: true,
          },
        }));
      });

      it('creates pending fetch action with meta', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            silent: true,
            pending: {
              id: 'GET /api/users',
            },
          },
        });
      });

      it('creates completed fetch action with meta', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: false,
          payload: [
            {
              id: 1,
              name: 'Some User',
              teams: [
                {
                  id: 1,
                  name: 'Some Team',
                },
              ],
            },
          ],
          meta: {
            silent: true,
            pending: {
              id: 'GET /api/users',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when called with schema', function () {
      beforeEach('dispatch #createFetchAction() action', function () {
        const userSchema = new Schema('users');
        const teamSchema = new Schema('teams');

        userSchema.define({
          teams: arrayOf(teamSchema),
        });

        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users',
          schema: arrayOf(userSchema),
        }));
      });

      it('creates pending fetch action', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            pending: {
              id: 'GET /api/users',
            },
          },
        });
      });

      it('creates completed fetch action with normalized payload', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: false,
          payload: {
            result: [1],
            entities: {
              users: {
                1: {
                  id: 1,
                  name: 'Some User',
                  teams: [1],
                },
              },
              teams: {
                1: {
                  id: 1,
                  name: 'Some Team',
                },
              },
            },
          },
          meta: {
            pending: {
              id: 'GET /api/users',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when server returns error', function () {
      beforeEach('mock GET /api/users/1', function () {
        fetchMock.get('/api/users/1', {
          body: {
            message: 'Not Found',
          },
          status: 404,
        });
      });

      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users/1',
        }));
      });

      it('creates pending fetch action', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            pending: {
              id: 'GET /api/users/1',
            },
          },
        });
      });

      it('creates completed fetch action with error', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: true,
          payload: {
            message: 'Not Found',
          },
          meta: {
            pending: {
              id: 'GET /api/users/1',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when server returns non-json response', function () {
      beforeEach('mock GET /api/users/1', function () {
        fetchMock.get('/api/users/1', {
          body: 'Error',
          status: 500,
        });
      });

      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users/1',
        }));
      });

      it('creates pending fetch action', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            pending: {
              id: 'GET /api/users/1',
            },
          },
        });
      });

      it('creates completed fetch action with error', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: true,
          payload: {
            message: 'Server Error',
          },
          meta: {
            pending: {
              id: 'GET /api/users/1',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when server is not available', function () {
      beforeEach('mock GET /api/users/1', function () {
        fetchMock.get('/api/users/1', {
          throws: new Error(),
        });
      });

      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users/1',
        }));
      });

      it('creates pending fetch action', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          meta: {
            pending: {
              id: 'GET /api/users/1',
            },
          },
        });
      });

      it('creates completed fetch action with error', function () {
        expect(store._dispatch).toHaveBeenCalledWith({
          type: SOME_ACTION,
          error: true,
          payload: {
            message: 'Network Error',
          },
          meta: {
            pending: {
              id: 'GET /api/users/1',
              completed: true,
            },
          },
        });
      });

      it('creates FSA compliant actions', function () {
        expect(store._dispatch.calls.every(({arguments: [action]}) => isFSA(action))).toBe(true);
      });
    });

    context('when previous call is pending', function () {
      beforeEach('create store', function () {
        store = createThunkStore(state => state, {
          pending: [
            {id: 'GET /api/users'},
          ],
        });
      });

      beforeEach('dispatch #createFetchAction() action', function () {
        return store.dispatch(createFetchAction(SOME_ACTION, {
          url: '/api/users',
        }));
      });

      it('does not create actions', function () {
        expect(store._dispatch).toNotHaveBeenCalled();
      });
    });
  });
});

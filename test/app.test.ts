import { StatusCodes } from 'http-status-codes';

import { MemberTaskManager } from 'graasp';
import { ItemMembershipTaskManager, ItemTaskManager, TaskRunner } from 'graasp-test';
import Runner from 'graasp-test/src/tasks/taskRunner';

import build from './app';
import { CURRENT_CUSTOMER, DEFAULT_CARD, PLAN, SETUP_INTENT } from './fixtures';

const runner = new Runner();
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const memberTaskManager = {
  getCreateTaskName: jest.fn(),
} as unknown as MemberTaskManager;
const itemTaskManager = new ItemTaskManager();

const mockCreateTaskSequence = (runner: TaskRunner, data) => {
  jest.spyOn(runner, 'runSingleSequence').mockImplementation(async () => {
    return data;
  });
};

const mockRunSingle = (runner: TaskRunner, data) => {
  jest.spyOn(runner, 'runSingle').mockImplementation(async () => {
    return data;
  });
};

describe('Subscription Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(jest.fn());
  });

  describe('GET /customer/current', () => {
    it('Successfully get customer', async () => {
      mockCreateTaskSequence(runner, CURRENT_CUSTOMER);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/customer/current',
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual(CURRENT_CUSTOMER);
    });
  });

  describe('PATCH /cards/:cardId/default', () => {
    it('Successfully change default card', async () => {
      mockCreateTaskSequence(runner, DEFAULT_CARD);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/cards/${DEFAULT_CARD.id}/default`,
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual(DEFAULT_CARD);
    });
  });

  describe('GET /cards', () => {
    it('Sucessfully list user cards', async () => {
      mockCreateTaskSequence(runner, [DEFAULT_CARD, DEFAULT_CARD]);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/cards',
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual([DEFAULT_CARD, DEFAULT_CARD]);
    });
  });

  describe('POST /setup-intent', () => {
    it('Sucessfully get setup intent', async () => {
      mockCreateTaskSequence(runner, SETUP_INTENT);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/setup-intent',
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual(SETUP_INTENT);
    });
  });

  describe('GET /plans/own', () => {
    it('Successfully get user current plan', async () => {
      mockCreateTaskSequence(runner, PLAN);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/plans/own',
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual(PLAN);
    });
  });

  describe('GET /plans', () => {
    it('Successfully list all plans', async () => {
      mockRunSingle(runner, [PLAN, PLAN]);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/plans',
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual([PLAN, PLAN]);
    });
  });

  describe('GET /plans/:planId', () => {
    it('Successfully get single plan', async () => {
      mockRunSingle(runner, [PLAN]);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/plans/${PLAN.id}`,
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual(PLAN);
    });
  });

  describe('PATCH /plans/:planId', () => {
    it('Successfully update plan with card', async () => {
      mockRunSingle(runner, [PLAN]);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/plans/${PLAN.id}`,
        payload: { cardId: DEFAULT_CARD.id },
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual(PLAN);
    });

    it('Successfully update plan with default card', async () => {
      mockRunSingle(runner, [PLAN]);

      const app = await build({
        runner,
        itemTaskManager,
        memberTaskManager,
        itemMembershipTaskManager,
      });

      const response = await app.inject({
        method: 'PATCH',
        url: `/plans/${PLAN.id}`,
        payload: {},
      });

      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(await response.json()).toEqual(PLAN);
    });
  });
});

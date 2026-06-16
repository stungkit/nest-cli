import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import { AbstractRunner } from '../../../lib/runners/abstract.runner';
import { MESSAGES } from '../../../lib/ui';

jest.mock('child_process');

describe('AbstractRunner', () => {
  let fakeChild: EventEmitter & { stdout: EventEmitter };
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    fakeChild = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
    });
    jest.spyOn(childProcess, 'spawn').mockReturnValue(fakeChild as any);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('run', () => {
    it('should print the failed command without duplicating the binary', async () => {
      const runner = new AbstractRunner('pnpm');
      const runPromise = runner.run('install --strict-peer-dependencies=false');

      // Simulate the spawned process exiting with a failure code.
      fakeChild.emit('close', 1);

      await expect(runPromise).rejects.toBeUndefined();

      // `.trim()` drops the leading newline so the assertion is not affected
      // by the ANSI color codes that `ansis` injects around line breaks.
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          MESSAGES.RUNNER_EXECUTION_ERROR(
            'pnpm install --strict-peer-dependencies=false',
          ).trim(),
        ),
      );
      expect(errorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('pnpm pnpm install'),
      );
    });
  });
});

import { TypeScriptBinaryLoader } from '../../../lib/compiler/typescript-loader';
import { CLI_ERRORS } from '../../../lib/ui';

describe('TypeScriptBinaryLoader', () => {
  it('should load the installed TypeScript that exposes the compiler API', () => {
    const loader = new TypeScriptBinaryLoader();
    const tsBinary = loader.load();
    expect(typeof tsBinary.getParsedCommandLineOfConfigFile).toBe('function');
  });

  it('should not throw for a TypeScript build exposing the programmatic API', () => {
    const loader = new TypeScriptBinaryLoader();
    const supportedBinary = {
      version: '6.0.3',
      getParsedCommandLineOfConfigFile: () => ({}),
    } as any;
    expect(() =>
      (loader as any).assertProgrammaticApiIsSupported(supportedBinary),
    ).not.toThrow();
  });

  it('should throw an actionable error when the programmatic API is missing (TypeScript 7)', () => {
    const loader = new TypeScriptBinaryLoader();
    const nativeBinary = { version: '7.0.2', sys: {} } as any;
    expect(() =>
      (loader as any).assertProgrammaticApiIsSupported(nativeBinary),
    ).toThrow(CLI_ERRORS.UNSUPPORTED_TYPESCRIPT_VERSION('7.0.2'));
  });
});

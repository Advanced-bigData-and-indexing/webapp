// This is a manual mock for redis module
export const createClient = jest.fn(() => ({
    // Mock any client method you use, for example:
    on: jest.fn(),
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    // Add other methods as needed
  }));
  
import '@testing-library/jest-dom';
import { api } from '../api/client';

beforeEach(() => {
  if (api && api.resetModelSession) {
    vi.spyOn(api, 'resetModelSession').mockResolvedValue({
      success: true,
      action_taken: 'SESSION_RESET',
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    });
  }
});

// Clean up mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});

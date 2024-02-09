// Connect to localhost on port 6379.

import { createClient } from 'redis';

export const client = createClient();

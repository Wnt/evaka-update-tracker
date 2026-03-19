import axios from 'axios';

// Force axios to use the fetch adapter in tests.
// nock 14 uses @mswjs/interceptors which conflicts with follow-redirects
// (used by the default http adapter) on Node 22+, causing "Invalid URL" errors.
// The fetch adapter is natively intercepted by nock 14.
axios.defaults.adapter = 'fetch';

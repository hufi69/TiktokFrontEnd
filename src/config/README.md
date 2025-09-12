# Configuration

## Switch Environment
Edit `index.js` and change `CURRENT_ENV`:

```javascript
const CURRENT_ENV = 'LOCAL'; // LOCAL | USB_DEBUG | NGROK | PRODUCTION
```

## Usage
```javascript
import { CONFIG, buildUrl, apiRequest } from './config';

// Build URL
const url = buildUrl(CONFIG.ENDPOINTS.AUTH_LOGIN);

// Make API request
const response = await apiRequest(CONFIG.ENDPOINTS.POSTS_LIST);
```

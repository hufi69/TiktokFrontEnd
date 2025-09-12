# Professional React Native App Structure

## 📁 Folder Organization

```
src/
├── components/           # Reusable UI Components
│   ├── auth/            # Authentication components
│   ├── post/            # Post-related components
│   ├── story/           # Story-related components
│   ├── common/          # Common/shared components
│   └── index.js         # Component exports
├── screens/             # Screen Components
│   ├── auth/            # Authentication screens
│   ├── main/            # Main app screens
│   ├── profile/         # Profile-related screens
│   └── index.js         # Screen exports
├── services/            # API Services
│   └── apiService.js    # Centralized API service
├── hooks/               # Custom React Hooks
│   ├── useApi.js        # API and utility hooks
│   └── hooks.js         # Redux hooks
├── utils/               # Utility Functions
│   ├── api/             # API utilities
│   ├── helpers/         # Helper functions
│   ├── animations/      # Animation utilities
│   └── index.js         # Utility exports
├── constants/           # App Constants
│   ├── theme.js         # Theme configuration
│   └── index.js         # Constant exports
├── config/              # Configuration
│   └── index.js         # Environment & API config
├── store/               # Redux Store
│   ├── slices/          # Redux slices
│   └── index.js         # Store configuration
├── data/                # Static Data
│   └── countries.json   # Country data
└── index.js             # Main exports
```

## 🚀 Usage Examples

### Import Components
```javascript
// Import specific component
import { AuthInput, PostItem } from '../components';

// Import from specific category
import { AuthInput } from '../components/auth';
```

### Import Screens
```javascript
// Import specific screen
import { LoginScreen, ProfileScreen } from '../screens';

// Import from specific category
import { LoginScreen } from '../screens/auth';
```

### Use API Service
```javascript
import { apiService } from '../services';

// Make API calls
const loginUser = async (credentials) => {
  const { data } = await apiService.auth.login(credentials);
  return data;
};
```

### Use Custom Hooks
```javascript
import { useApi, useForm } from '../hooks';

const MyComponent = () => {
  const { loading, error, execute } = useApi();
  const { values, setValue } = useForm({ email: '', password: '' });
  
  // Component logic
};
```



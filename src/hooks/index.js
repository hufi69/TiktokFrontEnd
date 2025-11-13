/**
 * Hooks Index
 * Central export point for all custom hooks
 * 
 * Architecture:
 * - redux/    → UI state only (modals, tabs, theme)
 * - api/      → Server state (API calls via React Query)
 * - common/   → Reusable utility hooks
 */

// API hooks (React Query) - Use these for server state
export * from './api';

// Redux hooks - Use these for UI state only
export * from './redux';

// Common utility hooks
export * from './common';

// Legacy support - maintaining backward compatibility
// These will be deprecated in favor of explicit imports
export * from './hooks';

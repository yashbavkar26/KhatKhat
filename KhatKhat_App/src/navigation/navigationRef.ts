import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

let queuedRoutes: Array<string> = [];

export function navigateFromRoot(routeName: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(routeName as never);
    return;
  }
  // Queue the route to navigate once the container becomes ready
  queuedRoutes.push(routeName);
}

export function flushQueuedNavigation() {
  if (!navigationRef.isReady() || queuedRoutes.length === 0) return;
  try {
    queuedRoutes.forEach((r) => navigationRef.navigate(r as never));
  } finally {
    queuedRoutes = [];
  }
}
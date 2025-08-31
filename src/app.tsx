import React from 'react';
import { RouterProvider, Router } from '@tanstack/react-router';
import './styles.css';

export function App({ router }: { router: Router<any, any> }) {
  return <RouterProvider router={router} />;
}
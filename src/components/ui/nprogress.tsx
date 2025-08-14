'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import './nprogress.css';

export function PageProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
      const currentUrl = window.location.href;
      if (targetUrl !== currentUrl) {
        NProgress.start();
      }
    };

    const handleMutation: MutationCallback = () => {
      const anchorElements = document.querySelectorAll('a');
      anchorElements.forEach(anchor => {
        if (!anchor.dataset.nprogressHandled) {
          anchor.addEventListener('click', handleAnchorClick);
          anchor.dataset.nprogressHandled = 'true';
        }
      });
    };

    const mutationObserver = new MutationObserver(handleMutation);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Initial run
    handleMutation([], mutationObserver);

    return () => {
      mutationObserver.disconnect();
      document.querySelectorAll('a').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
        delete anchor.dataset.nprogressHandled;
      });
    };
  }, []);

  return null;
}
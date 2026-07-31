(function initFDSMotion(globalScope) {
  const DEFAULT_EASE = 'power2.out';
  const TAB_SWITCH_EASE = 'sine.inOut';
  const FAST_EASE = 'power1.out';
  const SUMMARY_REFRESH_EASE = 'sine.inOut';
  const SUMMARY_PANEL_DURATION = 0.42;
  const SUMMARY_LIST_DURATION = 0.42;
  const SUMMARY_HEIGHT_THRESHOLD = 2;
  const SUMMARY_LIST_REVEAL_DURATION = 0.32;
  const SUMMARY_LIST_REVEAL_EASE = 'sine.inOut';
  const SUMMARY_POSITION_DURATION = 0.34;
  const PANEL_TARGET_SELECTOR = [
    '.fds-stat-box',
    '.fds-list-group',
    '.fds-list-item',
    '.fds-list-empty',
  ].join(', ');

  function toArray(value) {
    if (!value) return [];
    return Array.from(value).filter(Boolean);
  }

  function hasClass(element, className) {
    if (!element || !className) return false;
    if (typeof element.classList?.contains === 'function') {
      return element.classList.contains(className);
    }
    return String(element.className || '').split(/\s+/).includes(className);
  }

  function createFDSMotion({
    gsap = globalScope.gsap,
    matchMedia = globalScope.matchMedia?.bind?.(globalScope),
  } = {}) {
    function recordMotion(name) {
      if (!Array.isArray(globalScope.__fdsMotionEvents)) {
        globalScope.__fdsMotionEvents = [];
      }
      globalScope.__fdsMotionEvents.push(name);
    }

    function prefersReducedMotion() {
      try {
        return Boolean(matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
      } catch {
        return false;
      }
    }

    function canAnimate(target) {
      return Boolean(target && gsap && !prefersReducedMotion());
    }

    function resetInterruptedSummaryPanelMotion(target) {
      if (!hasClass(target, 'fds-summary-card')) return;
      target.classList?.remove?.('is-resizing');
      if (!target.style) return;
      target.style.opacity = '';
      target.style.visibility = '';
      target.style.transform = '';
      target.style.willChange = '';
    }

    function kill(targets) {
      if (gsap?.killTweensOf && targets) {
        gsap.killTweensOf(targets);
      }
      (Array.isArray(targets) ? targets : [targets]).forEach(resetInterruptedSummaryPanelMotion);
    }

    function animatePanelOpen(panel) {
      if (!canAnimate(panel) || typeof gsap.timeline !== 'function') return false;
      const children = toArray(panel.querySelectorAll?.(PANEL_TARGET_SELECTOR)).slice(0, 12);
      kill([panel, ...children]);

      const timeline = gsap.timeline({
        defaults: { ease: DEFAULT_EASE },
        overwrite: 'auto',
      });
      timeline.fromTo(
        panel,
        { autoAlpha: 0, y: 10, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.22 }
      );
      if (children.length) {
        timeline.fromTo(
          children,
          { autoAlpha: 0, y: 6 },
          { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.025, ease: FAST_EASE },
          '<0.04'
        );
      }
      recordMotion('panel-open');
      return true;
    }

    function animateSummaryPanelMove(panel, {
      fromRect,
      toRect,
    } = {}) {
      if (!canAnimate(panel) || !fromRect || !toRect) return false;
      const deltaX = Number(fromRect.left || 0) - Number(toRect.left || 0);
      const deltaY = Number(fromRect.top || 0) - Number(toRect.top || 0);
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return false;

      gsap.fromTo(
        panel,
        {
          x: deltaX,
          y: deltaY,
          willChange: 'transform',
        },
        {
          x: 0,
          y: 0,
          duration: SUMMARY_POSITION_DURATION,
          ease: DEFAULT_EASE,
          overwrite: 'auto',
          onComplete: () => {
            panel.style.transform = '';
            panel.style.willChange = '';
          },
        }
      );
      recordMotion('summary-panel-move');
      return true;
    }

    function animateSummaryRefresh(panel, {
      listChanged = true,
      fromPanelHeight = 0,
      toPanelHeight = 0,
      fromListHeight = 0,
      toListHeight = 0,
      shouldAnimateListHeight = false,
      force = false,
      listTransitionElement = null,
      revealListItems = true,
    } = {}) {
      if (!canAnimate(panel)) return false;
      const summaryList = panel.querySelector?.('.fds-summary-list');
      const summaryListChildren = summaryList ? toArray(summaryList.children) : [];
      const resolvedFromPanelHeight = Number(fromPanelHeight || panel.getBoundingClientRect().height || 0);
      const resolvedToPanelHeight = Number(toPanelHeight || panel.scrollHeight || 0);
      const resolvedFromListHeight = Number.isFinite(fromListHeight) ? Math.max(0, fromListHeight) : 0;
      const resolvedToListHeight = Number.isFinite(toListHeight) ? Math.max(0, toListHeight) : (summaryList ? summaryList.scrollHeight : 0);
      const panelHeightDelta = Math.abs(resolvedFromPanelHeight - resolvedToPanelHeight);
      const listHeightDelta = Math.abs(resolvedFromListHeight - resolvedToListHeight);
      const panelHeightDeltaEligible = panelHeightDelta >= SUMMARY_HEIGHT_THRESHOLD;
      const listHeightDeltaEligible = listHeightDelta >= SUMMARY_HEIGHT_THRESHOLD;
      const canAnimatePanelHeight = (force ? (panelHeightDeltaEligible || listChanged) : panelHeightDeltaEligible)
        && resolvedFromPanelHeight > 0
        && resolvedToPanelHeight > 0;
      const canAnimateListHeight = shouldAnimateListHeight
        && summaryList
        && resolvedFromListHeight >= 0
        && resolvedToListHeight >= 0
        && (force ? (listHeightDeltaEligible || listChanged) : listHeightDeltaEligible);
      const listAnimationOverflowY = hasClass(summaryList, 'is-scrollable') ? 'auto' : 'hidden';
      const didAnimate = canAnimatePanelHeight || canAnimateListHeight;
      if (didAnimate) {
        kill([panel, summaryList, listTransitionElement, ...summaryListChildren]);
        panel.classList?.add?.('is-resizing');
      }

      const isGrowingList = resolvedToListHeight > resolvedFromListHeight;
      const listInitialOpacity = revealListItems ? (isGrowingList ? 0.16 : 0.92) : 1;
      const listInitialTranslateY = 0;

      const timeline = typeof gsap.timeline === 'function'
        ? gsap.timeline({ defaults: { ease: SUMMARY_REFRESH_EASE, overwrite: 'auto' } })
        : null;

      if (canAnimatePanelHeight && timeline) {
        timeline.fromTo(
          panel,
          {
            height: `${resolvedFromPanelHeight}px`,
            overflow: 'hidden',
            willChange: 'height',
            transformOrigin: 'top',
          },
          {
            height: `${resolvedToPanelHeight}px`,
            ease: 'power2.out',
            duration: SUMMARY_PANEL_DURATION,
            immediateRender: false,
          },
          0,
        );
      }

      if (canAnimateListHeight && summaryList && timeline) {
        timeline.fromTo(
          summaryList,
          {
            height: `${resolvedFromListHeight}px`,
            maxHeight: 'none',
            opacity: listInitialOpacity,
            y: listInitialTranslateY,
            overflowX: 'hidden',
            overflowY: listAnimationOverflowY,
            willChange: 'height,opacity,transform',
          },
          {
            height: `${resolvedToListHeight}px`,
            opacity: 1,
            y: 0,
            duration: SUMMARY_LIST_DURATION,
            immediateRender: false,
            onStart: () => {
              summaryList.scrollTop = 0;
            },
          },
          canAnimatePanelHeight ? 0.02 : 0,
        );
      }

      if (listChanged && revealListItems && summaryListChildren.length > 0 && didAnimate) {
        const revealStart = canAnimateListHeight ? 0.08 : 0;

        if (timeline) {
          if (listTransitionElement) {
            timeline.fromTo(
              listTransitionElement,
              { y: 0, autoAlpha: 1 },
              {
                y: 0,
                autoAlpha: 0,
                duration: SUMMARY_LIST_DURATION,
                ease: SUMMARY_LIST_REVEAL_EASE,
              },
              0,
            );
          }

          timeline.fromTo(
            summaryList,
            { autoAlpha: isGrowingList ? 0.16 : 0.94, y: 0 },
            {
              autoAlpha: 1,
              y: 0,
              duration: SUMMARY_LIST_REVEAL_DURATION,
              ease: SUMMARY_LIST_REVEAL_EASE,
            },
            revealStart,
          );
          timeline.set(
            summaryListChildren,
            {
              autoAlpha: 0,
              y: isGrowingList ? 8 : -6,
              transformOrigin: 'top center',
            },
            revealStart + 0.02,
          );
          timeline.to(
            summaryListChildren,
            {
              autoAlpha: 1,
              y: 0,
              duration: SUMMARY_LIST_REVEAL_DURATION,
              ease: SUMMARY_LIST_REVEAL_EASE,
              stagger: isGrowingList ? 0.028 : 0.02,
              overwrite: 'auto',
            },
            revealStart + 0.04,
          );
        } else {
          gsap.to(
            summaryList,
            {
              autoAlpha: 1,
              y: 0,
              duration: SUMMARY_LIST_REVEAL_DURATION,
              ease: SUMMARY_LIST_REVEAL_EASE,
              overwrite: 'auto',
            },
          );

          if (listTransitionElement) {
            gsap.to(listTransitionElement, {
              autoAlpha: 0,
              y: isGrowingList ? -4 : 4,
              duration: SUMMARY_LIST_DURATION,
              ease: SUMMARY_LIST_REVEAL_EASE,
              overwrite: 'auto',
            });
          }
        }
      }

      if (didAnimate && timeline) {
        timeline.add(() => {
          panel.classList?.remove?.('is-resizing');
          panel.style.height = '';
          panel.style.overflow = '';
          panel.style.willChange = '';
          if (summaryList) {
            summaryList.style.height = '';
            summaryList.style.maxHeight = '';
            summaryList.style.opacity = '';
            summaryList.style.transform = '';
            summaryList.style.overflow = '';
            summaryList.style.overflowX = '';
            summaryList.style.overflowY = '';
            summaryList.style.willChange = '';
          }
          if (listTransitionElement) {
            listTransitionElement.remove();
          }
        });
      }

      if (didAnimate && !timeline) {
        if (canAnimatePanelHeight) {
          gsap.set(panel, {
            height: `${resolvedFromPanelHeight}px`,
            overflow: 'hidden',
            willChange: 'height',
          });
          gsap.to(panel, {
            height: `${resolvedToPanelHeight}px`,
            duration: SUMMARY_PANEL_DURATION,
            ease: SUMMARY_REFRESH_EASE,
            overwrite: 'auto',
            onComplete: () => {
              panel.classList?.remove?.('is-resizing');
              panel.style.height = '';
              panel.style.overflow = '';
              panel.style.willChange = '';
              if (listTransitionElement) listTransitionElement.remove();
            },
          });
        }

        if (canAnimateListHeight && summaryList) {
          gsap.set(summaryList, {
            height: `${resolvedFromListHeight}px`,
            maxHeight: 'none',
            overflowX: 'hidden',
            overflowY: listAnimationOverflowY,
            opacity: listInitialOpacity,
            y: listInitialTranslateY,
            willChange: 'height,opacity,transform',
          });
          gsap.to(summaryList, {
            height: `${resolvedToListHeight}px`,
            opacity: 1,
            y: 0,
            duration: SUMMARY_LIST_DURATION,
            ease: SUMMARY_REFRESH_EASE,
            overwrite: 'auto',
            onComplete: () => {
              panel.classList?.remove?.('is-resizing');
              summaryList.style.height = '';
              summaryList.style.maxHeight = '';
              summaryList.style.opacity = '';
              summaryList.style.transform = '';
              summaryList.style.overflow = '';
              summaryList.style.overflowX = '';
              summaryList.style.overflowY = '';
              summaryList.style.willChange = '';
              if (listTransitionElement) listTransitionElement.remove();
            },
          });
        }

        if (listTransitionElement && !canAnimatePanelHeight && !canAnimateListHeight) {
          gsap.to(listTransitionElement, {
            autoAlpha: 0,
            y: isGrowingList ? -4 : 4,
            duration: SUMMARY_LIST_DURATION,
            ease: SUMMARY_REFRESH_EASE,
            overwrite: 'auto',
            onComplete: () => {
              listTransitionElement.remove();
            },
          });
        }
      }

      if (!canAnimatePanelHeight && !canAnimateListHeight) {
        if (summaryList) {
          summaryList.style.maxHeight = '';
          summaryList.style.opacity = '';
          summaryList.style.overflow = '';
          summaryList.style.overflowX = '';
          summaryList.style.overflowY = '';
        }
        panel.style.height = '';
        panel.style.overflow = '';
        const targets = toArray(panel.querySelectorAll?.(PANEL_TARGET_SELECTOR)).slice(0, listChanged ? 14 : 6);
        if (!targets.length) return false;
        kill(targets);
        gsap.fromTo(
          targets,
          { autoAlpha: 0, y: 5 },
          { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.012, ease: FAST_EASE, overwrite: 'auto' }
        );
      }
      recordMotion('summary-refresh');
      return didAnimate;
    }

    function animateTabSwitch(panel, options = {}) {
      if (!canAnimate(panel)) return false;
      const activeTab = panel.querySelector?.('.fds-summary-tab.active');
      const indicator = panel.querySelector?.('.fds-summary-tab-indicator');
      let didAnimate = false;
      if (indicator) {
        kill(indicator);
          const duration = 0.35;
        const fromTabKey = options?.fromSummaryTab;
        const toTabKey = options?.toSummaryTab;
        const rootTabbar = panel.querySelector('.fds-summary-tabbar');
        const fromTab = fromTabKey && rootTabbar
          ? rootTabbar.querySelector(`.fds-summary-tab[data-summary-tab="${String(fromTabKey).replace(/"/g, '\\"')}"]`)
          : activeTab;
        const toTab = toTabKey && rootTabbar
          ? rootTabbar.querySelector(`.fds-summary-tab[data-summary-tab="${String(toTabKey).replace(/"/g, '\\"')}"]`)
          : activeTab;

        if (fromTab && toTab && rootTabbar) {
          const fromRect = fromTab.getBoundingClientRect();
          const toRect = toTab.getBoundingClientRect();
          const barRect = rootTabbar.getBoundingClientRect();
          const startLeft = Math.max(0, fromRect.left - barRect.left);
          const endLeft = Math.max(0, toRect.left - barRect.left);
          const startWidth = Math.max(0, Math.min(fromRect.width, rootTabbar.clientWidth));
          const endWidth = Math.max(0, Math.min(toRect.width, rootTabbar.clientWidth));

          gsap.set(indicator, {
            left: `${startLeft}px`,
            width: `${startWidth}px`,
            autoAlpha: 1,
          });
          gsap.to(indicator, {
            left: `${endLeft}px`,
            width: `${endWidth}px`,
            duration,
            ease: TAB_SWITCH_EASE,
            overwrite: 'auto',
          });
        } else {
          gsap.to(indicator, {
            autoAlpha: 1,
            duration: duration,
            ease: TAB_SWITCH_EASE,
            overwrite: 'auto',
          });
        }
        didAnimate = true;
      }
      if (didAnimate) recordMotion('tab-switch');
      return didAnimate;
    }

    function animateInspectorCard(card) {
      if (!canAnimate(card)) return false;
      kill(card);
      gsap.fromTo(
        card,
        { opacity: 0, y: 6, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.16, ease: DEFAULT_EASE, overwrite: 'auto' }
      );
      recordMotion('inspector-card');
      return true;
    }

    function animatePin(pin) {
      if (!canAnimate(pin)) return false;
      kill(pin);
      gsap.fromTo(
        pin,
        { scale: 0.86, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.18, ease: DEFAULT_EASE, overwrite: 'auto' }
      );
      recordMotion('pin');
      return true;
    }

    function animateCopySuccess(button) {
      if (!canAnimate(button)) return false;
      kill(button);
      gsap.fromTo(
        button,
        { scale: 0.96 },
        { scale: 1, duration: 0.16, ease: DEFAULT_EASE, overwrite: 'auto' }
      );
      recordMotion('copy-success');
      return true;
    }

    return {
      animatePanelOpen,
      animateTabSwitch,
      animateSummaryRefresh,
      animateSummaryPanelMove,
      animateInspectorCard,
      animatePin,
      animateCopySuccess,
      prefersReducedMotion,
    };
  }

  const api = { createFDSMotion };
  globalScope.FDSMotionFactory = api;
  globalScope.FDSMotion = createFDSMotion();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);

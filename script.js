document.addEventListener('DOMContentLoaded', function () {
  const headerFollow = document.querySelector('.header-follow');
  const header = document.querySelector('.header');
  const mobileNav = document.querySelector('.navigation');
  const spacerDiv = document.getElementById("spacer");
  const refreshImg = document.querySelector(".refresh");
  const loadingImg = document.querySelector(".loading");

  let lastScrollY = window.scrollY, currentTranslateY = 0, lastTimestamp = 0;
  let startY = 0, isSwipingDown = false, isRefreshing = false;
  let lazyLoadingEnabled = true; // Ensure this is accessible globally
  let headerLock = false; // Added for headerLock flag
  let opacityLock = false; // Added for opacityLock flag
  let isLocked = false;
  let isYearsOpen = false;
  let swipeSpeedThreshold = 2; // Define swipeSpeedThreshold globally
  let highlightedTweet = null;

  // Always set overscrollEnabled to true on page load
  sessionStorage.setItem('overscrollEnabled', 'true');

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const maxTweetElement = document.querySelector('meta[name="maxTweetIndex"]');
  const maxTweetIndex = maxTweetElement ? parseInt(maxTweetElement.getAttribute('content'), 10) : 3251;

  const mediaQuery = window.matchMedia("(pointer: coarse) and (max-width: 499px)");
  
  // Header Height Adjustment ==================================================================================
  // ===========================================================================================================
  function getHeaderHeight() {
    const headerHeight = getComputedStyle(header).getPropertyValue('--header-height').trim();
    return parseFloat(headerHeight);
  }

  // Define followHeight globally for use throughout the script
  const followHeight = getHeaderHeight();

  const maxSpacerHeight = followHeight;

  // Footer ====================================================================================================
  // ===========================================================================================================
  let isCopying = false;

  document.querySelector('.footer').addEventListener('click', function(event) {
    if (isCopying) return;
    isCopying = true;

    const copyText = document.querySelector('.copy').textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(function() {
        const copiedMessage = document.createElement('div');
        copiedMessage.textContent = 'Copied!';
        copiedMessage.classList.add('copied-message');
        document.body.appendChild(copiedMessage);

        copiedMessage.style.left = event.pageX + 'px';
        copiedMessage.style.top = event.pageY + 'px';
        copiedMessage.style.opacity = '1';

        setTimeout(function() {
          copiedMessage.style.opacity = '0';
          setTimeout(function() {
            document.body.removeChild(copiedMessage);
            isCopying = false;
          }, 200);
        }, 400);
      }).catch(function() {
        console.error('Failed to copy text: ', copyText);
        isCopying = false;
      });
    } else {
      console.error('Clipboard API not supported or not available.');
      isCopying = false;
    }
  });

  // Lazy Loading ==============================================================================================
  // ===========================================================================================================
  // Function to set lazy loading flag with logging
  function setLazyLoadingEnabled(value) {
    lazyLoadingEnabled = value;
    // console.log(`Lazy loading enabled: ${lazyLoadingEnabled}`);
  }

  // Modify lazy loading function to check the flag
  const lazyLoadMedia = () => {
    if (!lazyLoadingEnabled) {
      return;
    }

    const images = document.querySelectorAll('.media img[data-src]');
    const videos = document.querySelectorAll('.media video');

    const mediaObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!lazyLoadingEnabled) {
            return;
          }

          const media = entry.target;

          if (media.tagName.toLowerCase() === 'img') {
            const dataSrc = media.getAttribute('data-src');
            if (dataSrc) {  // Only proceed if data-src exists and is not null
              media.src = dataSrc;
              media.removeAttribute('data-src');
            }
          } else if (media.tagName.toLowerCase() === 'video') {
            const source = media.querySelector('source[data-src]');
            if (source) {
              const dataSrc = source.getAttribute('data-src');
              if (dataSrc) {  // Only proceed if data-src exists and is not null
                source.src = dataSrc;
                source.removeAttribute('data-src');
                media.load();
              }
            }
          }
          observer.unobserve(media);
        }
      });
    }, { threshold: 0.1 });

    images.forEach(image => {
      if (image.getAttribute('data-src')) {  // Only observe if data-src exists
        mediaObserver.observe(image);
      }
    });

    videos.forEach(video => {
      const source = video.querySelector('source[data-src]');
      if (source && source.getAttribute('data-src')) {  // Only observe if data-src exists
        mediaObserver.observe(video);
      }
    });
  };

  function toggleLazyLoading() {
    lazyLoadingEnabled = !lazyLoadingEnabled;
    // console.log(`Lazy loading toggled: ${lazyLoadingEnabled}`);
  }

  setTimeout(() => {
    lazyLoadMedia();
  }, 200);

  // Navigation Buttons ========================================================================================
  // ===========================================================================================================
  // Function to handle scrolling to a target position
  function scrollToPosition(targetPosition, targetElement) {
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    observeScrollBoundaries(targetElement);
  }

  // Function to handle navigation button click
  function handleNavigationClick(targetPosition, targetElement) {
    setLazyLoadingEnabled(false); // Disable lazy loading
    console.log("Lazy loading should now be disabled.");

    // Ensure the flag is set before scrolling
    setTimeout(() => {
      scrollToPosition(targetPosition, targetElement);
    }, 100); // Wait 100ms before scrolling
  }

  // Update navigation button event listeners
  const topButton = document.querySelector('.top');
  if (topButton) {
    topButton.addEventListener('click', function() {
      const spacer = document.getElementById('spacer');
      handleNavigationClick(0, spacer); // Scroll to top
      // Observe when the header is reached
      observeScrollBoundaries(document.querySelector('.header'));
    });
  }

  const bottomButton = document.querySelector('.bottom');
  if (bottomButton) {
    bottomButton.addEventListener('click', function() {
      const bottomElement = document.getElementById('bottom');
      handleNavigationClick(document.documentElement.scrollHeight, bottomElement); // Scroll to bottom
      // Observe when the footer is reached
      observeScrollBoundaries(document.querySelector('.footer'));
    });
  }

  const calendarButton = document.querySelector('.calendar');
  if (calendarButton) {
    calendarButton.addEventListener('click', function() {
      isYearsOpen = true;
      sessionStorage.setItem('overscrollEnabled', 'false');
      mobileNav.style.opacity = '1';
      mobileNav.style.transition = 'unset';

      const yearsElement = document.querySelector('.years');

      if (yearsElement) {
        yearsElement.classList.remove('query-768px');
        const elementsToRemoveClass = yearsElement.querySelectorAll('.query-768px');
        elementsToRemoveClass.forEach(element => {
          element.classList.remove('query-768px');
        });

        yearsElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
          yearsElement.style.opacity = '1';
        }, 100);
      }
    });
  }

  const hideYearsElement = (immediate = false) => {
    if (!isYearsOpen) return;

    const yearsElement = document.querySelector('.years');
    
    if (yearsElement) {
      yearsElement.style.opacity = '0';
      mobileNav.style.removeProperty('transition');
      
      const cleanup = () => {
        yearsElement.style.removeProperty('display');
        yearsElement.style.removeProperty('opacity');
        document.body.style.removeProperty('overflow');
        isYearsOpen = false;
        sessionStorage.setItem('overscrollEnabled', 'true');
      };

      if (immediate) {
        cleanup();
      } else {
        setTimeout(cleanup, 300);
      }
    }
  };

  // Add null checks before adding event listeners
  const yearsElement = document.querySelector('.years');
  if (yearsElement) {
    yearsElement.addEventListener('click', () => hideYearsElement(false));
    const closeButton = yearsElement.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => hideYearsElement(false));
    }

    // Add click handler for wrappers
    const wrappers = yearsElement.querySelectorAll('.wrapper');
    wrappers.forEach(wrapper => {
      wrapper.addEventListener('click', (e) => {
        const anchor = wrapper.querySelector('a');
        if (anchor && e.target === wrapper) {
          anchor.click();
        }
      });
    });
  }

  // Random Navigation =========================================================================================
  // ===========================================================================================================

  const randomButton = document.querySelector('.random');
  if (randomButton) {
    randomButton.addEventListener('click', function() {
      const maxTweetElement = document.querySelector('meta[name="maxTweetIndex"]');
      const maxTweetIndex = maxTweetElement ? parseInt(maxTweetElement.getAttribute('content'), 10) : 3251;

      setLazyLoadingEnabled(false); // Disable lazy loading

      // Generate a random index between 1 and maxTweetIndex (inclusive)
      const randomIndex = Math.floor(Math.random() * maxTweetIndex) + 1;
      const randomTweet = document.querySelector(`.tweet-${String(randomIndex).padStart(4, '0')}`);

      if (randomTweet) {
        if (isLocked) {
          return;
        }
        randomTweet.scrollIntoView({ behavior: 'auto' });
        window.scrollBy(0, 0);
        headerFollow.style.transform = 'translateY(0)';
        headerLock = true; // Set the flag to true
        mobileNav.style.opacity = '1';
        opacityLock = true; // Set the flag to true
        isLocked = true;
        
        setTimeout(() => {
          const followHeight = headerFollow ? headerFollow.offsetHeight : 0;
          window.scrollBy({
            top: -followHeight,
            behavior: 'smooth'
          });

          setTimeout(() => {
            // Highlight the randomly selected tweet
            randomTweet.style.backgroundColor = 'var(--hover-color)';
            highlightedTweet = randomTweet;  // Store reference to highlighted tweet
            headerLock = false;
            opacityLock = false;
            isLocked = false;
            setTimeout(() => {
              setLazyLoadingEnabled(true); // Re-enable lazy loading
              setTimeout(() => {
                lazyLoadMedia(); // Call lazy loading after a brief delay
              }, 100);
            }, 100);
          }, 200); // Adjust the delay as needed
        }, 200);
      } else {
        console.error(`Tweet with index ${randomIndex} not found.`);
      }
    });
  }

  // Keyboard Shortcuts =======================================================================================
  // ===========================================================================================================
  document.addEventListener('keydown', function(event) {
    // Only trigger if not typing in an input field
    if (event.target.tagName.toLowerCase() === 'input' || 
        event.target.tagName.toLowerCase() === 'textarea') {
      return;
    }

    switch(event.key.toLowerCase()) {
      case 's':
        // Trigger random button click
        document.querySelector('.random')?.click();
        break;
      case 'a':
        // Trigger top button click
        document.querySelector('.top')?.click();
        break;
      case 'd':
        // Trigger bottom button click
        document.querySelector('.bottom')?.click();
        break;
      case 'backspace':
        // Navigate to header link
        document.querySelector('.header-follow > div > a')?.click();
        event.preventDefault(); // Prevent browser back navigation
        break;
    }
  });

  // Scroll Observation ========================================================================================
  // ===========================================================================================================
  // Initialize overscrollEnabled in sessionStorage if not already set
  if (!sessionStorage.getItem('overscrollEnabled')) {
    sessionStorage.setItem('overscrollEnabled', 'true');
  }

  // Function to check the overscrollEnabled state
  function isOverscrollEnabled() {
    return sessionStorage.getItem('overscrollEnabled') === 'true';
  }

  if (window.matchMedia("(pointer: coarse)").matches) {
    window.addEventListener("touchstart", (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isSwipingDown = true;
      }
    });

    window.addEventListener("touchmove", (e) => {
      if (isSwipingDown && !isRefreshing && isOverscrollEnabled()) {
        const currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;

        if (pullDistance > 0) {
          e.preventDefault();
          spacerDiv.style.height = `${Math.min(pullDistance, followHeight)}px`;

          if (refreshImg) {
            refreshImg.style.display = window.scrollY === 0 ? 'block' : 'none';

            if (pullDistance >= followHeight) {
              refreshImg.style.transition = 'transform 0.3s ease';
              refreshImg.style.transform = 'rotate(180deg)';
            } else {
              refreshImg.style.transform = 'rotate(0deg)';
            }
          }
        }
      }
    }, { passive: false });

    window.addEventListener("touchend", () => {
      if (isSwipingDown) {
        const currentHeight = parseFloat(spacerDiv.style.height) || 0;
        
        if (currentHeight >= followHeight && !isRefreshing) {
          isRefreshing = true;
          triggerRefresh();
        } else {
          // Animate the spacer back up if not triggering refresh
          spacerDiv.style.transition = 'height 0.3s ease';
          spacerDiv.style.height = '0';
          if (refreshImg) {
            refreshImg.style.transition = 'transform 0.3s ease';
            refreshImg.style.transform = 'rotate(0deg)';
          }
          
          // Reset after animation
          setTimeout(() => {
            spacerDiv.style.transition = '';
            if (refreshImg) {
              refreshImg.removeAttribute('style');
            }
          }, 300);
        }
      }
      isSwipingDown = false;
    });
  }

  function observeScrollBoundaries(targetElement) {
    const observerOptions = {
      root: null, // Use the viewport as the root
      threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observerCallback = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.target.classList.contains('header') && entry.isIntersecting) {
          console.log('Reached the top of the page.');
          observer.unobserve(entry.target); // Stop observing once reached
          setTimeout(() => {
            setLazyLoadingEnabled(true); // Re-enable lazy loading
            // setTimeout(() => {
            //   lazyLoadMedia(); // Call lazy loading after a brief delay
            //   setTimeout(() => {
            //     window.scrollTo({
            //       top: 0,
            //       behavior: 'smooth'
            //     });
            //   }, 100);
            // }, 100);
          }, 100);
        }
        if (entry.target.classList.contains('footer') && entry.isIntersecting) {
          console.log('Reached the bottom of the page.');
          observer.unobserve(entry.target); // Stop observing first
          setTimeout(() => {
            setLazyLoadingEnabled(true); // Re-enable lazy loading
            // setTimeout(() => {
            //   lazyLoadMedia(); // Call lazy loading after a brief delay
            //   setTimeout(() => {
            //     window.scrollTo({
            //       top: document.documentElement.scrollHeight,
            //       behavior: 'smooth'
            //     });
            //   }, 250);
            // }, 100);
          }, 100);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    if (targetElement) {
      observer.observe(targetElement);
    }
  }

  
  // Refresh Loading ===========================================================================================
  // ===========================================================================================================
  const waitForAnimation = true; // Reload mid animation or let animation finish first

  function triggerRefresh() {
    if (waitForAnimation) {
      // Full animation sequence
      refreshImg.style.display = 'block';

      setTimeout(() => {
        refreshImg.removeAttribute('style');
        loadingImg.style.display = 'block';
      }, 500);

      setTimeout(() => {
        loadingImg.removeAttribute('style');
        refreshImg.style.display = 'block';

        refreshImg.style.transition = 'transform 0.5s ease';
        refreshImg.style.transform = 'rotate(0deg)';
      }, 1500);

      setTimeout(() => {
        resetRefresh();
      }, 1875);
      
      setTimeout(() => {
        window.location.reload();
      }, 2375);
    } else {
      // Quick reload in middle of animation
      refreshImg.style.display = 'block';

      setTimeout(() => {
        refreshImg.removeAttribute('style');
        loadingImg.style.display = 'block';
      }, 500);

      setTimeout(() => {
        sessionStorage.setItem('isReload', 'true');
        window.location.reload();
      }, 1500);
    }
  }

  function resetRefresh() {
    isRefreshing = false;
    spacerDiv.style.height = "0";
    refreshImg.removeAttribute('style');
    loadingImg.removeAttribute('style');
    refreshImg.style.transition = '';
  }

  // Handle reload animation state
  loadingImg.removeAttribute('style');
  refreshImg.style.display = 'block';

  if (sessionStorage.getItem('isReload') === 'true') {
    spacerDiv.style.height = `${maxSpacerHeight}px`;
    spacerDiv.style.transition = 'none';

    setTimeout(() => {
      spacerDiv.style.transition = 'height 0.3s ease';
      spacerDiv.style.height = '0';
      refreshImg.style.transition = 'transform 0.5s ease';
      refreshImg.style.transform = 'rotate(0deg)';
      
      setTimeout(() => {
        resetRefresh();
        sessionStorage.removeItem('isReload');
      }, 200);
    }, 500);
  } else {
    refreshImg.style.transition = 'transform 0.5s ease';
    refreshImg.style.transform = 'rotate(0deg)';

    setTimeout(() => {
      resetRefresh(); 
    }, 200);
  }

  
  // Mobile Scrolling/Navigation ===============================================================================
  // ===========================================================================================================
  document.querySelector('.header-follow').addEventListener('click', function () {
    window.scrollTo(0, 0);
  });

  function adjustHeaderFollowPosition(event) {
    if (mediaQuery.matches && headerFollow) {
      const headerHeight = headerFollow.offsetHeight;
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      const currentTimestamp = event.timeStamp;
      const timeDelta = currentTimestamp - lastTimestamp;
      const scrollSpeed = Math.abs(deltaY / timeDelta);

      if (headerLock) { // Check if headerLock is set
        return;
      }

      if (currentScrollY <= headerHeight) {
        const revealPercentage = 1 - (currentScrollY / headerHeight);
        currentTranslateY = -headerHeight * (1 - revealPercentage);
      } else if (deltaY > 0) {
        currentTranslateY = Math.max(currentTranslateY - deltaY, -headerHeight);
      } else if (deltaY < 0 && scrollSpeed > swipeSpeedThreshold) {
        currentTranslateY = Math.min(currentTranslateY - deltaY, 0);
      }

      headerFollow.style.transform = `translateY(${currentTranslateY}px)`;
      adjustMobileNavOpacity(currentScrollY, scrollSpeed, deltaY);
      lastScrollY = currentScrollY;
      lastTimestamp = currentTimestamp;
    }
  }

  window.addEventListener("scroll", adjustHeaderFollowPosition);

  function adjustMobileNavOpacity(scrollY, scrollSpeed, deltaY) {
    if (opacityLock) { // Check if opacityLock is set
      return;
    }
    if (mediaQuery.matches && mobileNav && headerFollow) {
      const headerHeight = headerFollow.offsetHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const distanceFromBottom = documentHeight - (scrollY + viewportHeight);
      const bottomThreshold = 53;
      let opacity = mobileNav.style.opacity; // Start with current opacity

      if (deltaY < 0 && scrollSpeed > swipeSpeedThreshold) {
        // Scrolling up quickly
        opacity = 1;
      } else if (deltaY > 0) {
        // Scrolling down
        opacity = 0.3;
      } else if (scrollY <= headerHeight) {
        const revealPercentage = 1 - (scrollY / headerHeight);
        opacity = 0.3 + revealPercentage * 0.7;
      } else if (distanceFromBottom <= bottomThreshold) {
        const revealPercentage = 1 - (distanceFromBottom / bottomThreshold);
        opacity = 0.3 + revealPercentage * 0.7;
      }

      opacity = Math.max(0.3, Math.min(1, opacity));
      mobileNav.style.opacity = opacity;
      // console.log(`MobileNav opacity set to ${opacity}`);
    }
  }

  // Function to reset translate and opacity
  function resetTranslateAndOpacity() {
    if (headerFollow) {
      headerFollow.style.transform = 'translateY(0)';
    }
    if (mobileNav) {
      mobileNav.style.opacity = '1';
    }
  }

  // Media Query Changes =======================================================================================
  // ===========================================================================================================

  // notes: min width is for when window width is increasing, max width is for when window width decreases

  // Media queries to listen for changes
  const tabletReset = window.matchMedia("(pointer: coarse) and (min-width: 500px), (pointer: fine)");

  // Add listeners to media queries
  tabletReset.addEventListener('change', (e) => {
    if (e.matches) {
      console.log("Media query matched:", e.media);
      resetTranslateAndOpacity();
    }
  });

  // Media queries to listen for changes

  // const calendarReset = window.matchMedia("(min-width: 1143px), (pointer: coarse) and (max-width: 499px)");
  const calendarReset = window.matchMedia("(pointer: coarse) and (max-width: 499px)");
  
  // Use addEventListener instead of addListener
  calendarReset.addEventListener('change', (e) => {
    if (e.matches) {
      console.log("Media query matched:", e.media);
      hideYearsElement();
      // hideYearsElement(true);  // Pass true for immediate execution
    }
  });

  // Restore Scroll Position ===================================================================================
  // ===========================================================================================================
  let showLogs = false; // Set to true to enable console logs

  function logTweetClassOnIntersect() {
    const tweetObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Check if element is a banner
          if (element.classList.contains('banner')) {
            if (showLogs) console.log('Current position: banner (top)');
            localStorage.setItem('currentTweet', 'banner');
            return;
          }
          
          // Handle tweet blocks as before
          const tweetClass = Array.from(element.classList).find(cls => /^tweet-\d{4}$/.test(cls));
          if (tweetClass) {
            if (showLogs) console.log('Current tweet:', tweetClass);
            localStorage.setItem('currentTweet', tweetClass);
          }
        }
      });
    }, { rootMargin: '0px 0px -99% 0px' });

    // Observe both tweet blocks and banners
    const tweets = document.querySelectorAll('.tweet-block, .banner');
    tweets.forEach(element => {
      tweetObserver.observe(element);
    });
  }

  // Update restoreScrollPosition to handle banner case
  function restoreScrollPosition() {
    const savedTweetClass = localStorage.getItem('currentTweet');
    if (savedTweetClass === 'banner') {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    
    if (savedTweetClass) {
      const savedTweetElement = document.querySelector(`.${savedTweetClass}`);
      if (savedTweetElement) {
        const mediaQuery = window.matchMedia('(pointer: coarse)');
        const followHeight = headerFollow ? headerFollow.offsetHeight : 0;

        if (mediaQuery.matches) {
          savedTweetElement.scrollIntoView({ behavior: 'auto' });
        } else {
          const offset = savedTweetElement.getBoundingClientRect().top - followHeight;
          window.scrollBy({ top: offset, behavior: 'auto' });
        }
      }
    }
  }

  // Add event listener to reset scroll position when a .years > a link is clicked
  document.querySelectorAll('.years .wrapper, .years .wrapper > a').forEach(link => {
    link.addEventListener('click', () => {
      localStorage.removeItem('currentTweet'); // Clear the saved tweet
      window.scrollTo(0, 0); // Reset scroll position to the top
    });
  });

  // Call the function to restore scroll position on page load
  window.addEventListener('load', restoreScrollPosition);

  // Call the function to set up the observer
  logTweetClassOnIntersect();

  // Add this function to remove highlight
  function removeHighlight() {
    if (highlightedTweet) {
      highlightedTweet.style.removeProperty('background-color');
      highlightedTweet = null;
    }
  }

  // Add scroll event listener to remove highlight (add this where other scroll listeners are defined)
  window.addEventListener("scroll", function() {
    removeHighlight();
  });
});

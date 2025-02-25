document.addEventListener('DOMContentLoaded', function () {
    const tweetContainers = document.querySelectorAll('.tweet-block, .tweet-contents, .profile, .banner');
    const currentPage = window.location.pathname;

    tweetContainers.forEach(tweet => {
        const mediaContents = tweet.querySelectorAll('.media');
        const interactions = tweet.querySelector('.interactions');

        if (mediaContents.length > 0 && interactions) {
            mediaContents.forEach((mediaContent, index) => {
                mediaContent.querySelectorAll('img').forEach(img => {
                    img.addEventListener('click', function () {
                        if (!document.querySelector('.lightbox')) {
                            const commentCount = interactions.querySelector('.comment span').textContent.trim();
                            const retweetCount = interactions.querySelector('.retweet span').textContent.trim();
                            const likeCount = interactions.querySelector('.like span').textContent.trim();

                            createLightbox(img, commentCount, retweetCount, likeCount);
                            saveLightboxState(currentPage, img.src, commentCount, retweetCount, likeCount);
                            preventScroll(true);
                        }
                    });
                });
            });
        }

        if (tweet.classList.contains('profile') || tweet.classList.contains('banner')) {
            tweet.querySelectorAll('img').forEach(img => {
                img.addEventListener('click', function () {
                    if (!document.querySelector('.lightbox')) {
                        createLightbox(img, '', '', '');
                        preventScroll(true);
                    }
                });
            });
        }
    });

    const storedLightbox = localStorage.getItem(`lightboxState_${currentPage}`);
    if (storedLightbox) {
        const { imgSrc, commentCount, retweetCount, likeCount } = JSON.parse(storedLightbox);
        const img = new Image();
        img.src = imgSrc;
        createLightbox(img, commentCount, retweetCount, likeCount);
        preventScroll(true);
    }

    function createLightbox(img, commentCount, retweetCount, likeCount) {
        // Set overscrollEnabled to false when lightbox is created
        sessionStorage.setItem('overscrollEnabled', 'false');

        const lightbox = document.createElement('div');
        lightbox.classList.add('lightbox');

        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox) {
                closeLightbox(lightbox);
            }
        });

        // Add the new header div
        const header = document.createElement('div');
        header.classList.add('lightbox-header');
        lightbox.appendChild(header);

        // Create wrapper for the lightbox image
        const wrapper = document.createElement('div');
        wrapper.classList.add('img-wrapper');

        const lightboxImage = document.createElement('img');
        lightboxImage.src = img.src;
        wrapper.appendChild(lightboxImage); // Append the image to the wrapper
        lightbox.appendChild(wrapper); // Append the wrapper to the lightbox

        const coarsePointerMediaQuery = window.matchMedia('(pointer: coarse) and (max-width: 629px)');

        function updateImageSize() {
            lightboxImage.style.width = '';
        }

        updateImageSize(coarsePointerMediaQuery);
        coarsePointerMediaQuery.addEventListener('change', updateImageSize);

        const interactionsContainer = document.createElement('div');
        interactionsContainer.classList.add('lightbox-interactions');

        if (commentCount || retweetCount || likeCount) {
            const commentBox = createInteractionBox('../svg/lightbox-comment.svg', commentCount, 'js-comments');
            const retweetBox = createInteractionBox('../svg/lightbox-retweet.svg', retweetCount, 'js-retweets');
            const likeBox = createInteractionBox('../svg/lightbox-heart.svg', likeCount, 'js-likes');

            if (coarsePointerMediaQuery.matches) {
                interactionsContainer.style.justifyContent = 'space-between';
                commentBox.style.marginLeft = '12px';
                likeBox.style.marginRight = '12px';
                interactionsContainer.appendChild(commentBox);
                interactionsContainer.appendChild(retweetBox);
                interactionsContainer.appendChild(likeBox);
            } else {
                interactionsContainer.appendChild(commentBox);
                interactionsContainer.appendChild(createSpacing());
                interactionsContainer.appendChild(retweetBox);
                interactionsContainer.appendChild(createSpacing());
                interactionsContainer.appendChild(likeBox);
            }
        }

        lightbox.appendChild(interactionsContainer);

        const closeButton = document.createElement('div');
        closeButton.classList.add('close-button');
        closeButton.addEventListener('click', function () {
            closeLightbox(lightbox);
        });

        lightbox.appendChild(closeButton);

        document.body.appendChild(lightbox);
    }

    function closeLightbox(lightbox) {
        document.body.removeChild(lightbox);
        preventScroll(false);
        clearLightboxState();

        // Set overscrollEnabled to true when lightbox is closed
        sessionStorage.setItem('overscrollEnabled', 'true');
    }

    function preventScroll(prevent) {
        document.body.style.overflow = prevent ? 'hidden' : '';
    }

    function createInteractionBox(iconSrc, count, className) {
        // Map old class names to new ones
        const classMap = {
            'js-comments': 'comment',
            'js-retweets': 'retweet',
            'js-likes': 'like'
        };

        const link = document.createElement('a');
        link.classList.add(classMap[className] || className); // Only use the mapped class name
        link.href = ""; // Set href to an empty string

        const icon = document.createElement('img');
        icon.src = iconSrc;
        icon.classList.add('interaction-icon');
        link.appendChild(icon);

        const interactionText = document.createElement('span');
        interactionText.textContent = count;

        link.appendChild(interactionText);

        link.addEventListener('mouseenter', function () {
            link.classList.add('hovered');
            icon.classList.add('hover-icon');
        });

        link.addEventListener('mouseleave', function () {
            link.classList.remove('hovered');
            icon.classList.remove('hover-icon');
        });

        return link;
    }

    function createSpacing() {
        const spacing = document.createElement('div');
        spacing.classList.add('spacer');
        return spacing;
    }

    function saveLightboxState(page, imgSrc, commentCount, retweetCount, likeCount) {
        const lightboxState = { imgSrc, commentCount, retweetCount, likeCount };
        localStorage.setItem(`lightboxState_${page}`, JSON.stringify(lightboxState));
    }

    function clearLightboxState() {
        localStorage.removeItem(`lightboxState_${currentPage}`);
    }
	
	// Update CSS custom property for correct mobile viewport height
	function updateViewportHeight() {
		const vh = window.innerHeight * 0.01; // Get 1% of the viewport height
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}

	// Initial update
	updateViewportHeight();

	// Update on resize
	window.addEventListener('resize', updateViewportHeight);

    // Function to check the overscrollEnabled state
    function isOverscrollEnabled() {
        return sessionStorage.getItem('overscrollEnabled') === 'true';
    }

});

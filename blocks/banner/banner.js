export default function decorate(block) {
  // 1. CLEAR PARENT PADDING
  const parentSection = block.closest('.section');
  if (parentSection) {
    parentSection.style.padding = '0';
    parentSection.style.maxWidth = 'unset';
    parentSection.style.margin = '0 auto';
  }

  // 2. GET THE IMAGE
  const picture = block.querySelector('picture');
  const img = block.querySelector('img');
  
  let imageHTML = '';

  if (picture) {
    const imgTag = picture.querySelector('img');
    if (imgTag) {
      imgTag.setAttribute('loading', 'eager');
      imgTag.setAttribute('alt', 'Channel Banner');
    }
    imageHTML = picture.outerHTML;
  } else if (img) {
    img.setAttribute('loading', 'eager');
    img.setAttribute('alt', 'Channel Banner');
    imageHTML = img.outerHTML;
  } else {
    imageHTML = '<div class="banner-placeholder"></div>';
  }

  // 3. EXTRACT TEXT CONTENT
  // Get all divs that contain text (not image containers)
  const contentDivs = Array.from(block.querySelectorAll('div')).filter(div => {
    return !div.querySelector('picture') && !div.querySelector('img') && div.textContent.trim();
  });

  // Extract heading and subtext
  let heading = 'Learn To Make Easy Websites On Easy Tutorial';
  let subtext = 'Subscribe now';

  if (contentDivs.length > 0) {
    heading = contentDivs[0].textContent.trim();
  }
  if (contentDivs.length > 1) {
    subtext = contentDivs[1].textContent.trim();
  }

  // 4. BUILD HTML WITH TEXT OVERLAY
  block.innerHTML = `
    <div class="banner-outer">
      <div class="banner-inner">
        <div class="banner-wrapper">
          ${imageHTML}
          <div class="banner-content">
            <h1 class="banner-heading">${heading}</h1>
            <button class="banner-button">${subtext}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
export default function decorate(block) {
  // Clear parent section padding
  const parentSection = block.closest('.section');
  if (parentSection) {
    const sectionDiv = parentSection.querySelector('div');
    if (sectionDiv) {
      sectionDiv.style.padding = '0';
      sectionDiv.style.maxWidth = 'none';
      sectionDiv.style.margin = '0';
    }
  }

  // Get the image
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

  // Extract text content
  const contentDivs = Array.from(block.querySelectorAll('div')).filter(div => {
    return !div.querySelector('picture') && !div.querySelector('img') && div.textContent.trim();
  });

  let heading = 'Learn To Make Easy Websites On Easy Tutorial';
  let subtext = 'Subscribe now';

  if (contentDivs.length > 0) {
    heading = contentDivs[0].textContent.trim();
  }
  if (contentDivs.length > 1) {
    subtext = contentDivs[1].textContent.trim();
  }

  // Build HTML with corrected class names matching CSS
  block.innerHTML = `
    <div class="banner-outer">
      <div class="banner-inner">
        <div class="banner-content-wrapper">
          ${imageHTML}
          <div class="banner-text-content">
            <h1 class="banner-heading">${heading}</h1>
            <button class="banner-button">${subtext}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
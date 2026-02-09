export default function decorate(block) {
  const rows = [...block.children];
  const videos = [];

  console.log('Thumbnails block - Total rows:', rows.length);

  if (rows.length === 0) {
    console.error('No rows found in block');
    return;
  }

  // CHECK STRUCTURE: da.live uses 4 columns (thumbnail | avatar | title | channel)
  const firstRow = rows[0];
  const columnCount = firstRow.children.length;
  
  console.log('Columns per row:', columnCount);

  // HORIZONTAL TABLE FORMAT (da.live)
  // Column 0 = Thumbnail, Column 1 = Avatar, Column 2 = Title, Column 3 = Channel
  if (columnCount >= 3) {
    console.log('Using HORIZONTAL table format');
    console.log('Column structure:', columnCount === 4 ? 'thumbnail | avatar | title | channel' : 'thumbnail | title | channel');
    
    rows.forEach((row, index) => {
      let thumbnailCell, avatarCell, titleCell, channelCell;
      
      if (columnCount === 4) {
        // 4-column format: thumbnail | avatar | title | channel
        thumbnailCell = row.children[0];
        avatarCell = row.children[1];
        titleCell = row.children[2];
        channelCell = row.children[3];
      } else {
        // 3-column format: thumbnail | title | channel (no avatar)
        thumbnailCell = row.children[0];
        titleCell = row.children[1];
        channelCell = row.children[2];
        avatarCell = null;
      }
      
      // Extract thumbnail
      const thumbnail = thumbnailCell?.querySelector('picture, img');
      
      // Extract avatar
      const avatar = avatarCell?.querySelector('picture, img');
      
      // Extract title and link
      let title = 'Untitled Video';
      let link = '#';
      
      if (titleCell) {
        const linkElement = titleCell.querySelector('a');
        if (linkElement) {
          title = linkElement.textContent?.trim() || title;
          link = linkElement.href || link;
        } else {
          title = titleCell.textContent?.trim() || title;
        }
      }
      
      // Extract channel name
      let channel = 'Channel';
      if (channelCell) {
        const channelLink = channelCell.querySelector('a');
        if (channelLink) {
          channel = channelLink.textContent?.trim() || channel;
          if (link === '#') {
            link = channelLink.href || link;
          }
        } else {
          channel = channelCell.textContent?.trim() || channel;
        }
      }
      
      if (thumbnail) {
        videos.push({ thumbnail, title, channel, link, avatar });
        console.log(`Row ${index + 1}: "${title}" by "${channel}"`, avatar ? '✓ avatar' : '✗ no avatar');
      } else {
        console.log(`Row ${index + 1}: No thumbnail found, skipping`);
      }
    });
  } 
  // FALLBACK: Single column format (stacked)
  else {
    console.log('Using STACKED format (one item per row)');
    
    const hasAvatar = rows[4]?.querySelector('picture, img') ? true : false;
    const rowsPerVideo = hasAvatar ? 5 : 4;
    
    for (let i = 0; i < rows.length; i += rowsPerVideo) {
      const thumbnail = rows[i]?.querySelector('picture, img');
      const titleRow = rows[i + 1];
      const channelRow = rows[i + 2];
      const linkRow = rows[i + 3];
      const avatarRow = hasAvatar ? rows[i + 4] : null;

      let title = titleRow?.textContent?.trim() || 'Untitled Video';
      let channel = channelRow?.textContent?.trim() || 'Channel';
      
      const linkElement = linkRow?.querySelector('a') || 
                         titleRow?.querySelector('a') ||
                         channelRow?.querySelector('a');
      const link = linkElement?.href || '#';
      
      const avatar = avatarRow?.querySelector('picture, img');

      if (thumbnail) {
        videos.push({ thumbnail, title, channel, link, avatar });
      }
    }
  }

  console.log('✅ Total videos found:', videos.length);

  if (videos.length === 0) {
    console.error('❌ No videos found! Check your block structure.');
    block.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ff0000; background: #fff3f3; border-radius: 8px;">
        <h3>⚠️ No videos found</h3>
        <p>Expected structure: Thumbnail | Avatar | Title | Channel (4 columns)</p>
        <p>Or: Thumbnail | Title | Channel (3 columns)</p>
      </div>
    `;
    return;
  }

  // Generate thumbnail cards HTML
  const thumbnailCards = videos.map((video, index) => {
    const thumbnailHTML = video.thumbnail.tagName === 'PICTURE' 
      ? video.thumbnail.outerHTML 
      : `<img src="${video.thumbnail.src}" alt="${video.title}" loading="lazy">`;

    // Avatar: Use custom image if provided, otherwise generate letter
    let avatarHTML;
    if (video.avatar) {
      avatarHTML = video.avatar.tagName === 'PICTURE'
        ? video.avatar.outerHTML
        : `<img src="${video.avatar.src}" alt="${video.channel}" class="avatar-image">`;
    } else {
      const avatarLetter = video.channel.charAt(0).toUpperCase();
      avatarHTML = `<span class="avatar-circle">${avatarLetter}</span>`;
    }

    return `
      <a href="${video.link}" class="thumbnail-card" data-index="${index}" data-title="${video.title.toLowerCase()}" data-channel="${video.channel.toLowerCase()}">
        <div class="thumbnail-image-wrapper">
          ${thumbnailHTML}
        </div>
        <div class="thumbnail-info">
          <div class="thumbnail-avatar">
            ${avatarHTML}
          </div>
          <div class="thumbnail-details">
            <h3 class="thumbnail-title">${video.title}</h3>
            <p class="thumbnail-channel">${video.channel}</p>
          </div>
        </div>
      </a>
    `;
  }).join('');

  // Replace block content
  block.innerHTML = `
    <div class="thumbnails-grid">
      ${thumbnailCards}
    </div>
  `;
}
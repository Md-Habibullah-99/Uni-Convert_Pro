// Inject fixed footer navigation and About button via DOM manipulation
document.addEventListener('DOMContentLoaded', () => {
  try {
    const headerContainer = document.querySelector('.common-header .common-container');
    if (headerContainer) {
      let right = headerContainer.querySelector('.header-right');
      if (!right) {
        right = document.createElement('div');
        right.className = 'header-right';
        headerContainer.appendChild(right);
      }
      right.innerHTML = '';
      const aboutLink = document.createElement('a');
      aboutLink.href = 'about.html';
      aboutLink.className = 'about-btn secondary';
      aboutLink.textContent = 'About';
      right.appendChild(aboutLink);
    }

    // Remove any existing footer to avoid duplicates
    document.querySelectorAll('.page-footer').forEach((el) => el.remove());

    // Build footer navigation
    const footer = document.createElement('footer');
    footer.className = 'page-footer';
    const container = document.createElement('div');
    container.className = 'common-container nav-links';

    const links = [
      { href: 'upload.html', text: 'Upload' },
      { href: 'selected.html', text: 'Selected' },
      { href: 'download.html', text: 'Download' },
    ];
    const page = (location.pathname.split('/').pop() || '').toLowerCase();
    let active = 'upload.html';
    if (page === 'selected.html') active = 'selected.html';
    else if (page === 'download.html') active = 'download.html';
    else if (page === 'about.html') active = '';

    for (const l of links) {
      const a = document.createElement('a');
      a.href = l.href;
      a.textContent = l.text;
      if (l.href === active) a.classList.add('active');
      container.appendChild(a);
    }
    footer.appendChild(container);
    document.body.appendChild(footer);
  } catch (e) {
    console.error('UI injection failed:', e);
  }
});

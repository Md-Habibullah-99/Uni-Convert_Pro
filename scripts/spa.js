(function(){
  const SECTIONS = ['upload','convert'];

  function showSection(name){
    const target = SECTIONS.includes(name) ? name : 'upload';
    SECTIONS.forEach(id => {
      const el = document.getElementById('section-' + id);
      if (el) el.style.display = (id === target) ? 'block' : 'none';
    });
    const links = document.querySelectorAll('.page-footer .nav-links a[data-section]');
    links.forEach(a => {
      if (a.getAttribute('data-section') === target) a.classList.add('active');
      else a.classList.remove('active');
    });
    if (location.hash !== '#' + target) {
      history.replaceState(null, '', '#' + target);
    }
  }

  function parseInitial(){
    const hash = (location.hash || '').replace('#','');
    // Backward-compatible mapping for old hashes
    if (hash === 'selected' || hash === 'download') return 'convert';
    if (SECTIONS.includes(hash)) return hash;
    return 'upload';
  }

  function init(){
    showSection(parseInitial());
    window.addEventListener('hashchange', () => {
      const next = (location.hash || '').replace('#','');
      showSection(next);
    });
  }

  window.showSection = showSection;
  document.addEventListener('DOMContentLoaded', init);
})();
